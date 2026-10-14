import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import type { Sql } from "../db/client"
import { creaDatabaseTest, saltaDb, type DatabaseTest } from "../../test/db-test"
import { azzeraTentativi, registraTentativoFallito, verificaTentativiAccesso } from "./rate-limit"

// Gira sul Postgres reale (TEST_DATABASE_ADMIN_URL), con il ruolo mensa_app.
let db: DatabaseTest

before(async () => {
  if (!saltaDb) db = await creaDatabaseTest("rate")
})

after(async () => {
  if (!saltaDb) await db.chiudi()
})

async function creaClientTest(): Promise<Sql> {
  return db.sql
}

async function bloccatoFino(client: Sql, ip: string): Promise<number> {
  const [riga] = await client<{ bloccato_fino_ms: string }[]>`SELECT bloccato_fino_ms FROM tentativi_accesso WHERE ip = ${ip}`
  return Number(riga.bloccato_fino_ms)
}

describe("rate limiting login", { skip: saltaDb }, () => {
  test("permette i primi 5 tentativi", async () => {
    const client = await creaClientTest()
    const ip = "192.168.1.1"
    const ora = 1000000

    for (let i = 0; i < 5; i++) {
      const result = await verificaTentativiAccesso(client, ip, ora)
      assert.equal(result.consentito, true, `tentativo ${i + 1} dovrebbe essere consentito`)
      await registraTentativoFallito(client, ip, ora)
    }

    const bloccato = await verificaTentativiAccesso(client, ip, ora)
    assert.equal(bloccato.consentito, false, "dopo 5 tentativi dovrebbe bloccare")
  })

  test("blocco scaduto permette nuovo tentativo", async () => {
    const client = await creaClientTest()
    const ip = "192.168.1.2"
    let ora = 1000000

    for (let i = 0; i < 5; i++) {
      await registraTentativoFallito(client, ip, ora)
    }

    const bloccato = await verificaTentativiAccesso(client, ip, ora)
    assert.equal(bloccato.consentito, false, "dovrebbe essere bloccato")
    assert.ok(bloccato.riprovaDopoMs && bloccato.riprovaDopoMs > 0)

    ora += bloccato.riprovaDopoMs + 1000

    const permesso = await verificaTentativiAccesso(client, ip, ora)
    assert.equal(permesso.consentito, true, "dopo scadenza blocco dovrebbe permettere tentativo")
  })

  test("failure dopo scadenza raddoppia il backoff", async () => {
    const client = await creaClientTest()
    const ip = "192.168.1.3"
    let ora = 1000000

    for (let i = 0; i < 5; i++) {
      await registraTentativoFallito(client, ip, ora)
    }

    const primoBackoff = await bloccatoFino(client, ip)

    ora = primoBackoff + 1000
    await registraTentativoFallito(client, ip, ora)

    const secondoBackoff = await bloccatoFino(client, ip)

    const primoBackoffDurata = primoBackoff - 1000000
    const secondoBackoffDurata = secondoBackoff - ora

    assert.ok(secondoBackoffDurata > primoBackoffDurata, "il secondo backoff dovrebbe essere più lungo")
  })

  test("backoff esponenziale con cap a 30 minuti", async () => {
    const client = await creaClientTest()
    const ip = "192.168.1.4"
    const MAX_BACKOFF = 30 * 60 * 1000
    let ora = 1000000

    for (let i = 0; i < 20; i++) {
      await registraTentativoFallito(client, ip, ora)
      const fino = await bloccatoFino(client, ip)
      if (fino) {
        ora = fino + 100
      }
    }

    const [riga] = await client<{ tentativi: number; bloccato_fino_ms: string }[]>`
      SELECT tentativi, bloccato_fino_ms FROM tentativi_accesso WHERE ip = ${ip}
    `

    const tentativi = Number(riga.tentativi)
    const fino = Number(riga.bloccato_fino_ms)
    const backoffMs = fino - ora

    assert.ok(tentativi >= 5, "dovrebbe avere molti tentativi")
    assert.ok(backoffMs <= MAX_BACKOFF, `backoff ${backoffMs}ms non dovrebbe superare ${MAX_BACKOFF}ms`)
  })

  test("quiet window di 60s azzera tentativi", async () => {
    const client = await creaClientTest()
    const ip = "192.168.1.5"
    let ora = 1000000

    for (let i = 0; i < 5; i++) {
      await registraTentativoFallito(client, ip, ora)
    }

    const primaScadenza = await bloccatoFino(client, ip)

    ora = primaScadenza + 61000

    const result = await verificaTentativiAccesso(client, ip, ora)
    assert.equal(result.consentito, true)
    assert.equal(result.tentativiRimasti, 5, "dopo quiet window dovrebbe azzerare tentativi")
  })

  test("azzera tentativi dopo login riuscito", async () => {
    const client = await creaClientTest()
    const ip = "192.168.1.6"
    const ora = 1000000

    for (let i = 0; i < 3; i++) {
      await registraTentativoFallito(client, ip, ora)
    }

    await azzeraTentativi(client, ip)

    const result = await verificaTentativiAccesso(client, ip, ora)
    assert.equal(result.consentito, true, "dopo reset dovrebbe permettere l'accesso")
    assert.equal(result.tentativiRimasti, 5, "dovrebbe avere tutti i tentativi disponibili")
  })

  test("restituisce tempo di attesa quando bloccato", async () => {
    const client = await creaClientTest()
    const ip = "192.168.1.7"
    const ora = 1000000

    for (let i = 0; i < 6; i++) {
      await registraTentativoFallito(client, ip, ora)
    }

    const result = await verificaTentativiAccesso(client, ip, ora)
    assert.equal(result.consentito, false)
    assert.ok(result.riprovaDopoMs !== undefined && result.riprovaDopoMs > 0)
  })

  test("i millisecondi oltre i 32 bit restano esatti", async () => {
    const client = await creaClientTest()
    const ip = "192.168.1.8"
    const ora = Date.UTC(2026, 9, 14, 8, 0, 0)

    for (let i = 0; i < 5; i++) await registraTentativoFallito(client, ip, ora)

    assert.equal(await bloccatoFino(client, ip), ora + 5_000)
    const bloccato = await verificaTentativiAccesso(client, ip, ora + 1_000)
    assert.deepEqual(bloccato, { consentito: false, riprovaDopoMs: 4_000 })
  })
})
