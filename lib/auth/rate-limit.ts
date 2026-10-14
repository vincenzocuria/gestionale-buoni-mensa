/**
 * Rate limiting per protezione brute-force sul login.
 *
 * Limiti:
 * - Massimo 5 tentativi di login falliti per IP
 * - Backoff esponenziale dopo il limite: 5s, 10s, 20s, 40s, 80s, 160s, 320s (cap: 30 min)
 * - Reset automatico dopo login riuscito
 * - Finestra di quiet period: dopo 60s dalla scadenza blocco, i tentativi si azzerano
 * - Dopo scadenza blocco: permette 1 tentativo (se fallisce, raddoppia il backoff precedente)
 *
 * Lo stato sta nella tabella mensa.tentativi_accesso, condivisa fra le istanze.
 */

import type { Esecutore } from "@/lib/db/client"

const MAX_TENTATIVI = 5
const FINESTRA_MS = 60_000
const BACKOFF_BASE_MS = 5_000
const MAX_BACKOFF_MS = 30 * 60 * 1000

export interface RateLimitResult {
  consentito: boolean
  tentativiRimasti?: number
  riprovaDopoMs?: number
}

export async function verificaTentativiAccesso(client: Esecutore, ip: string, ora = Date.now()): Promise<RateLimitResult> {
  const righe = await leggiRiga(client, ip)

  if (righe.length === 0) {
    return { consentito: true, tentativiRimasti: MAX_TENTATIVI }
  }

  const riga = righe[0]
  const tentativi = Number(riga.tentativi)
  const bloccatoFinoMs = Number(riga.bloccato_fino_ms)

  if (bloccatoFinoMs > ora) {
    return {
      consentito: false,
      riprovaDopoMs: bloccatoFinoMs - ora,
    }
  }

  if (bloccatoFinoMs > 0 && bloccatoFinoMs < ora && ora - bloccatoFinoMs > FINESTRA_MS) {
    await azzeraTentativi(client, ip)
    return { consentito: true, tentativiRimasti: MAX_TENTATIVI }
  }

  if (tentativi >= MAX_TENTATIVI && bloccatoFinoMs > 0 && bloccatoFinoMs < ora) {
    return { consentito: true, tentativiRimasti: 1 }
  }

  return { consentito: true, tentativiRimasti: Math.max(0, MAX_TENTATIVI - tentativi) }
}

export async function registraTentativoFallito(client: Esecutore, ip: string, ora = Date.now()): Promise<void> {
  const righe = await leggiRiga(client, ip)

  let nuoviTentativi = 1
  let nuovoBloccoMs = 0

  if (righe.length > 0) {
    const riga = righe[0]
    const tentativiPrec = Number(riga.tentativi)
    const bloccatoFinoMs = Number(riga.bloccato_fino_ms)

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

  await client`
    INSERT INTO tentativi_accesso (ip, tentativi, bloccato_fino_ms)
    VALUES (${ip}, ${nuoviTentativi}, ${nuovoBloccoMs})
    ON CONFLICT (ip) DO UPDATE SET tentativi = EXCLUDED.tentativi, bloccato_fino_ms = EXCLUDED.bloccato_fino_ms
  `
}

export async function azzeraTentativi(client: Esecutore, ip: string): Promise<void> {
  await client`DELETE FROM tentativi_accesso WHERE ip = ${ip}`
}

// bloccato_fino_ms è bigint: postgres.js lo restituisce come stringa, Number() lo riporta a numero.
async function leggiRiga(client: Esecutore, ip: string) {
  return client<{ tentativi: number | string; bloccato_fino_ms: number | string }[]>`
    SELECT tentativi, bloccato_fino_ms FROM tentativi_accesso WHERE ip = ${ip}
  `
}
