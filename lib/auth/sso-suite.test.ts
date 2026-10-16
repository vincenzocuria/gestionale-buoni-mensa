import assert from "node:assert/strict"
import { createPublicKey, generateKeyPairSync, randomUUID, sign } from "node:crypto"
import { test } from "node:test"
import { creaTokenSessione, daRinnovare, leggiSessione } from "./sessione"
import { verificaTokenSuite } from "./sso-suite"

const { privateKey } = generateKeyPairSync("ed25519")
const pubblica = createPublicKey(privateKey)

function token(campi: Record<string, unknown>, chiave = privateKey): string {
  const adesso = Math.floor(Date.parse("2026-10-14T08:00:00Z") / 1000)
  const t = Buffer.from(JSON.stringify({ alg: "EdDSA", typ: "JWT" })).toString("base64url")
  const c = Buffer.from(JSON.stringify({
    iss: "suite-comune", aud: "mensa", sub: "u-1", email: "anna@comune.it", nome: "Anna Bianchi", ruolo: "utente",
    ruolo_modulo: "operatore", iat: adesso, nbf: adesso - 5, exp: adesso + 60, jti: randomUUID(), ...campi,
  })).toString("base64url")
  return `${t}.${c}.${sign(null, Buffer.from(`${t}.${c}`), chiave).toString("base64url")}`
}

const ADESSO = Date.parse("2026-10-14T08:00:10Z")

test("token della suite valido", () => {
  const p = verificaTokenSuite(token({}), ADESSO, pubblica)
  assert.ok(p)
  assert.equal(p.email, "anna@comune.it")
  assert.equal(p.ruolo_modulo, "operatore")
})

test("token di un utente senza email: valido, con il nome utente", () => {
  const p = verificaTokenSuite(token({ email: undefined, nome_utente: "mario.rossi" }), ADESSO, pubblica)
  assert.ok(p)
  assert.equal(p.nome_utente, "mario.rossi")
  assert.equal(p.email, undefined)
  assert.equal(verificaTokenSuite(token({ sub: "" }), ADESSO, pubblica), null, "senza sub no")
  const precedente = process.env.MENSA_SESSION_SECRET
  process.env.MENSA_SESSION_SECRET = "x".repeat(40)
  try {
    const s = creaTokenSessione({ sub: "u-2", nome_utente: "mario.rossi", nome: "Mario Rossi", ruolo_modulo: "lettura" })
    assert.equal(leggiSessione(s)?.nome_utente, "mario.rossi")
  } finally {
    if (precedente == null) delete process.env.MENSA_SESSION_SECRET
    else process.env.MENSA_SESSION_SECRET = precedente
  }
})

test("token rifiutati: pubblico, emittente, scadenza, chiave, ruolo, formato", () => {
  assert.equal(verificaTokenSuite(token({ aud: "presenze" }), ADESSO, pubblica), null)
  assert.equal(verificaTokenSuite(token({ iss: "altro" }), ADESSO, pubblica), null)
  assert.equal(verificaTokenSuite(token({}), ADESSO + 120_000, pubblica), null)
  assert.equal(verificaTokenSuite(token({ nbf: Math.floor(ADESSO / 1000) + 60 }), ADESSO, pubblica), null)
  assert.equal(verificaTokenSuite(token({}, generateKeyPairSync("ed25519").privateKey), ADESSO, pubblica), null)
  assert.equal(verificaTokenSuite(token({ ruolo_modulo: "admin" }), ADESSO, pubblica), null)
  assert.equal(verificaTokenSuite(token({ jti: "" }), ADESSO, pubblica), null)
  assert.equal(verificaTokenSuite("a.b.c", ADESSO, pubblica), null)
})

test("sessione firmata: lettura, manomissione, scadenza, rinnovo", () => {
  const precedente = process.env.MENSA_SESSION_SECRET
  process.env.MENSA_SESSION_SECRET = "x".repeat(40)
  try {
    const adesso = Date.now()
    const s = creaTokenSessione({ sub: "u-1", email: "anna@comune.it", nome: "Anna", ruolo_modulo: "lettura" }, adesso)
    assert.equal(leggiSessione(s, adesso)?.ruolo_modulo, "lettura")
    const [p, f] = s.split(".")
    const alterato = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(p, "base64url").toString()), ruolo_modulo: "responsabile" })).toString("base64url")
    assert.equal(leggiSessione(`${alterato}.${f}`, adesso), null)
    assert.equal(leggiSessione(s, adesso + 9 * 3600 * 1000), null)
    assert.equal(leggiSessione(undefined, adesso), null)
    const dati = leggiSessione(s, adesso)!
    assert.equal(daRinnovare(dati, 15 * 60, adesso + 10 * 60 * 1000), false)
    assert.equal(daRinnovare(dati, 15 * 60, adesso + 16 * 60 * 1000), true)
  } finally {
    if (precedente == null) delete process.env.MENSA_SESSION_SECRET
    else process.env.MENSA_SESSION_SECRET = precedente
  }
})
