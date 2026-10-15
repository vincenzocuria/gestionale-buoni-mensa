import { createPublicKey, verify, type KeyObject } from "node:crypto"

// Verifica del token emesso dalla Suite comunale (JWS EdDSA/Ed25519).
// Specifica: docs/SSO.md nel repository suite-comune.

export const PUBBLICO = "mensa"
const EMITTENTE = "suite-comune"

export type RuoloModulo = "lettura" | "operatore" | "responsabile"

export type PayloadSuite = {
  iss: string
  aud: string
  sub: string
  // Il nome utente c'è sempre (le suite precedenti non lo mandavano); l'email solo
  // per chi ce l'ha: alcuni dipendenti non hanno un indirizzo.
  nome_utente?: string
  email?: string
  nome: string
  ruolo: string
  ruolo_modulo: RuoloModulo
  iat: number
  nbf: number
  exp: number
  jti: string
}

let chiaveCache: KeyObject | null = null

function chiavePubblica(): KeyObject {
  if (chiaveCache) return chiaveCache
  const pem = process.env.SUITE_SSO_PUBLIC_KEY
  if (!pem) throw new Error("SUITE_SSO_PUBLIC_KEY non configurata")
  chiaveCache = createPublicKey(pem.includes("\\n") ? pem.replace(/\\n/g, "\n") : pem)
  return chiaveCache
}

export function verificaTokenSuite(token: string, adessoMs = Date.now(), chiave?: KeyObject): PayloadSuite | null {
  if (!token || token.length > 4000) return null
  const parti = token.split(".")
  if (parti.length !== 3) return null
  const [testata, corpo, firma] = parti
  try {
    const intestazione = JSON.parse(Buffer.from(testata, "base64url").toString("utf8")) as { alg?: string }
    if (intestazione.alg !== "EdDSA") return null
    if (!verify(null, Buffer.from(`${testata}.${corpo}`), chiave ?? chiavePubblica(), Buffer.from(firma, "base64url"))) return null
    const p = JSON.parse(Buffer.from(corpo, "base64url").toString("utf8")) as PayloadSuite
    const adesso = Math.floor(adessoMs / 1000)
    if (p.iss !== EMITTENTE || p.aud !== PUBBLICO) return null
    if (typeof p.exp !== "number" || p.exp < adesso) return null
    if (typeof p.nbf !== "number" || p.nbf > adesso + 5) return null
    if (!p.jti || !p.sub) return null
    if (!["lettura", "operatore", "responsabile"].includes(p.ruolo_modulo)) return null
    return p
  } catch {
    return null
  }
}
