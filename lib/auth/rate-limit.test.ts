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

    for (let i = 0; i < 5; i++) {
      const result = await verificaTentativiAccesso(client, ip)
      assert.equal(result.consentito, true, `tentativo ${i + 1} dovrebbe essere consentito`)
      await registraTentativoFallito(client, ip)
    }

    const bloccato = await verificaTentativiAccesso(client, ip)
    assert.equal(bloccato.consentito, false, "dopo 5 tentativi dovrebbe bloccare")
  })

  test("backoff esponenziale con cap a 30 minuti", async () => {
    const client = await creaClientTest()
    const ip = "192.168.1.2"
    const MAX_BACKOFF = 30 * 60 * 1000

    for (let i = 0; i < 5; i++) {
      await registraTentativoFallito(client, ip)
    }

    const ora = Date.now()
    for (let i = 0; i < 10; i++) {
      await registraTentativoFallito(client, ip)
    }

    const risultato = await client.execute({
      sql: "SELECT bloccato_fino_ms FROM tentativi_accesso WHERE ip = ?",
      args: [ip],
    })

    const bloccatoFino = Number(risultato.rows[0].bloccato_fino_ms)
    const backoffMs = bloccatoFino - ora

    assert.ok(backoffMs > 0, "dovrebbe essere bloccato")
    assert.ok(backoffMs <= MAX_BACKOFF, `backoff ${backoffMs}ms non dovrebbe superare ${MAX_BACKOFF}ms`)
  })

  test("azzera tentativi dopo login riuscito", async () => {
    const client = await creaClientTest()
    const ip = "192.168.1.3"

    for (let i = 0; i < 3; i++) {
      await registraTentativoFallito(client, ip)
    }

    await azzeraTentativi(client, ip)

    const result = await verificaTentativiAccesso(client, ip)
    assert.equal(result.consentito, true, "dopo reset dovrebbe permettere l'accesso")
    assert.equal(result.tentativiRimasti, 5, "dovrebbe avere tutti i tentativi disponibili")
  })

  test("restituisce tempo di attesa quando bloccato", async () => {
    const client = await creaClientTest()
    const ip = "192.168.1.4"

    for (let i = 0; i < 6; i++) {
      await registraTentativoFallito(client, ip)
    }

    const result = await verificaTentativiAccesso(client, ip)
    assert.equal(result.consentito, false)
    assert.ok(result.riprovaDopoMs !== undefined && result.riprovaDopoMs > 0)
  })
})
