import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { createClient, type Client } from "@libsql/client"
import { azzeraTentativi, registraTentativoFallito, verificaTentativiAccesso } from "./rate-limit"

async function creaClientTest(): Promise<Client> {
  const client = createClient({ url: ":memory:" })
  await client.execute(`
    CREATE TABLE tentativi_accesso (
      ip TEXT PRIMARY KEY,
      tentativi INTEGER NOT NULL DEFAULT 0,
      bloccato_fino_ms INTEGER NOT NULL DEFAULT 0
    )
  `)
  return client
}

describe("rate limiting login", () => {
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

    let bloccato = await verificaTentativiAccesso(client, ip, ora)
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

    const primoBackoff = (await client.execute({
      sql: "SELECT bloccato_fino_ms FROM tentativi_accesso WHERE ip = ?",
      args: [ip],
    })).rows[0].bloccato_fino_ms as number

    ora = primoBackoff + 1000
    await registraTentativoFallito(client, ip, ora)

    const secondoBackoff = (await client.execute({
      sql: "SELECT bloccato_fino_ms FROM tentativi_accesso WHERE ip = ?",
      args: [ip],
    })).rows[0].bloccato_fino_ms as number

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
      const result = await client.execute({
        sql: "SELECT bloccato_fino_ms FROM tentativi_accesso WHERE ip = ?",
        args: [ip],
      })
      if (result.rows[0].bloccato_fino_ms) {
        ora = Number(result.rows[0].bloccato_fino_ms) + 100
      }
    }

    const risultato = await client.execute({
      sql: "SELECT tentativi, bloccato_fino_ms FROM tentativi_accesso WHERE ip = ?",
      args: [ip],
    })

    const tentativi = Number(risultato.rows[0].tentativi)
    const bloccatoFino = Number(risultato.rows[0].bloccato_fino_ms)
    const backoffMs = bloccatoFino - ora

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

    const primaScadenza = (await client.execute({
      sql: "SELECT bloccato_fino_ms FROM tentativi_accesso WHERE ip = ?",
      args: [ip],
    })).rows[0].bloccato_fino_ms as number

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
})
