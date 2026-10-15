import { createHmac, timingSafeEqual } from "node:crypto"
import type { RuoloModulo } from "@/lib/auth/sso-suite"

// Sessione personale firmata (HMAC-SHA256) creata dopo l'accesso dalla suite.
// Contiene l'identità dell'utente: niente più password condivisa dell'ufficio.

export const NOME_COOKIE = "mensa_sessione"
export const DURATA_SECONDI = 8 * 60 * 60

export type DatiSessione = {
  sub: string
  nome_utente?: string
  email?: string
  nome: string
  ruolo_modulo: RuoloModulo
  iat: number
  exp: number
}

// Ogni 15 minuti la sessione si rinnova passando dalla suite, che ricontrolla
// che l'utente sia ancora attivo e abilitato (revoca effettiva entro 15 minuti).
export const RINNOVO_PAGINE_SECONDI = 15 * 60
// Le chiamate alle API restano valide un po' di più, per non perdere un lavoro in corso.
export const RINNOVO_API_SECONDI = 60 * 60

export function daRinnovare(dati: DatiSessione, limiteSecondi: number, adessoMs = Date.now()): boolean {
  return Math.floor(adessoMs / 1000) - dati.iat > limiteSecondi
}

function segreto(): string {
  const s = process.env.MENSA_SESSION_SECRET
  if (!s || s.length < 32) throw new Error("MENSA_SESSION_SECRET mancante o troppo corta (min 32 caratteri)")
  return s
}

function firma(payload: string): string {
  return createHmac("sha256", segreto()).update(payload).digest("base64url")
}

export function creaTokenSessione(dati: Omit<DatiSessione, "exp" | "iat">, adessoMs = Date.now()): string {
  const iat = Math.floor(adessoMs / 1000)
  const payload = Buffer.from(JSON.stringify({ ...dati, iat, exp: iat + DURATA_SECONDI })).toString("base64url")
  return `${payload}.${firma(payload)}`
}

export function leggiSessione(valore: string | undefined | null, adessoMs = Date.now()): DatiSessione | null {
  if (!valore || valore.length > 2000) return null
  const [payload, firmaRicevuta, extra] = valore.split(".")
  if (!payload || !firmaRicevuta || extra !== undefined) return null
  try {
    const attesa = Buffer.from(firma(payload))
    const ricevuta = Buffer.from(firmaRicevuta)
    if (attesa.length !== ricevuta.length || !timingSafeEqual(attesa, ricevuta)) return null
    const dati = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as DatiSessione
    if (typeof dati.exp !== "number" || typeof dati.iat !== "number" || dati.exp * 1000 < adessoMs) return null
    if (!dati.sub) return null
    return dati
  } catch {
    return null
  }
}

export function opzioniCookie() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURATA_SECONDI,
  }
}
