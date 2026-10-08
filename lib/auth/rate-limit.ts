/**
 * Rate limiting per protezione brute-force sul login.
 *
 * Limiti:
 * - Massimo 5 tentativi di login falliti per IP
 * - Backoff esponenziale dopo il limite: 5s, 10s, 20s, 40s, 80s, 160s, 320s (cap: 30 min)
 * - Reset automatico dopo login riuscito
 * - Pulizia automatica dei record vecchi (> 7 giorni)
 *
 * Compatibile con ambiente serverless (Vercel) usando tabella Turso.
 */

import type { Client } from "@libsql/client"

const MAX_TENTATIVI = 5
const FINESTRA_MS = 60_000
const BACKOFF_BASE_MS = 5_000
const MAX_BACKOFF_MS = 30 * 60 * 1000

export interface RateLimitResult {
  consentito: boolean
  tentativiRimasti?: number
  riprovaDopoMs?: number
}

export async function verificaTentativiAccesso(client: Client, ip: string): Promise<RateLimitResult> {
  const ora = Date.now()

  const risultato = await client.execute({
    sql: "SELECT tentativi, bloccato_fino_ms FROM tentativi_accesso WHERE ip = ?",
    args: [ip],
  })

  if (risultato.rows.length === 0) {
    return { consentito: true, tentativiRimasti: MAX_TENTATIVI }
  }

  const riga = risultato.rows[0]
  const tentativi = Number(riga.tentativi)
  const bloccatoFinoMs = Number(riga.bloccato_fino_ms)

  if (bloccatoFinoMs > ora) {
    return {
      consentito: false,
      riprovaDopoMs: bloccatoFinoMs - ora,
    }
  }

  if (tentativi >= MAX_TENTATIVI) {
    return { consentito: false }
  }

  return { consentito: true, tentativiRimasti: MAX_TENTATIVI - tentativi }
}

export async function registraTentativoFallito(client: Client, ip: string): Promise<void> {
  const ora = Date.now()

  const risultato = await client.execute({
    sql: "SELECT tentativi, bloccato_fino_ms FROM tentativi_accesso WHERE ip = ?",
    args: [ip],
  })

  let nuoviTentativi = 1
  let nuovoBloccoMs = 0

  if (risultato.rows.length > 0) {
    const riga = risultato.rows[0]
    const tentativiPrec = Number(riga.tentativi)
    const bloccatoFinoMs = Number(riga.bloccato_fino_ms)

    if (bloccatoFinoMs > ora) {
      return
    }

    if (bloccatoFinoMs > 0 && ora - bloccatoFinoMs > FINESTRA_MS) {
      nuoviTentativi = 1
    } else {
      nuoviTentativi = tentativiPrec + 1
    }
  }

  if (nuoviTentativi >= MAX_TENTATIVI) {
    const backoffMs = BACKOFF_BASE_MS * Math.pow(2, nuoviTentativi - MAX_TENTATIVI)
    nuovoBloccoMs = ora + Math.min(backoffMs, MAX_BACKOFF_MS)
  }

  await client.execute({
    sql: `INSERT INTO tentativi_accesso (ip, tentativi, bloccato_fino_ms) 
          VALUES (?, ?, ?) 
          ON CONFLICT(ip) DO UPDATE SET tentativi = ?, bloccato_fino_ms = ?`,
    args: [ip, nuoviTentativi, nuovoBloccoMs, nuoviTentativi, nuovoBloccoMs],
  })
}

export async function azzeraTentativi(client: Client, ip: string): Promise<void> {
  await client.execute({
    sql: "DELETE FROM tentativi_accesso WHERE ip = ?",
    args: [ip],
  })
}

export async function pulisciTentativiVecchi(client: Client): Promise<void> {
  const unaSettimanaFa = Date.now() - 7 * 24 * 60 * 60 * 1000
  await client.execute({
    sql: "DELETE FROM tentativi_accesso WHERE bloccato_fino_ms > 0 AND bloccato_fino_ms < ?",
    args: [unaSettimanaFa],
  })
}
