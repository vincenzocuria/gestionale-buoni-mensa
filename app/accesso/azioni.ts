"use server"

import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { NOME_COOKIE, opzioniCookie, passwordCorretta, tokenSessione } from "@/lib/auth/sessione"
import { assicuraTabellaEsiste, azzeraTentativi, registraTentativoFallito, verificaTentativiAccesso, type RateLimitResult } from "@/lib/auth/rate-limit"
import { getClient } from "@/lib/db/client"

async function ottieniIp(): Promise<string> {
  const headersList = await headers()
  return (
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
    headersList.get("x-real-ip") ||
    "unknown"
  )
}

export async function entra(
  _stato: { errore: string } | null,
  form: FormData,
): Promise<{ errore: string }> {
  const ip = await ottieniIp()
  const client = getClient()

  try {
    await assicuraTabellaEsiste(client)
  } catch {
    // Se fallisce la creazione tabella, continua senza rate limiting
  }

  const rateLimit = await verificaTentativiAccesso(client, ip).catch(
    (): RateLimitResult => ({ consentito: true, tentativiRimasti: 5 })
  )
  if (!rateLimit.consentito) {
    if (rateLimit.riprovaDopoMs) {
      const secondi = Math.ceil(rateLimit.riprovaDopoMs / 1000)
      return { errore: `Troppi tentativi. Riprova tra ${secondi} secondi.` }
    }
    return { errore: "Troppi tentativi. Riprova più tardi." }
  }

  const inserita = String(form.get("password") ?? "")
  if (!passwordCorretta(inserita)) {
    await registraTentativoFallito(client, ip).catch(() => {})
    const produzione = process.env.NODE_ENV === "production"
    return {
      errore: process.env.UFFICIO_PASSWORD
        ? "Password non corretta."
        : produzione
          ? "Servizio non disponibile."
          : "Accesso non configurato: manca UFFICIO_PASSWORD.",
    }
  }

  const token = tokenSessione()
  if (!token) {
    const produzione = process.env.NODE_ENV === "production"
    return { errore: produzione ? "Servizio non disponibile." : "Accesso non configurato: manca UFFICIO_PASSWORD." }
  }

  await azzeraTentativi(client, ip).catch(() => {})

  const jar = await cookies()
  jar.set(NOME_COOKIE, token, opzioniCookie())
  redirect("/")
}

export async function esci(): Promise<void> {
  const jar = await cookies()
  jar.delete(NOME_COOKIE)
  redirect("/accesso")
}
