import { NextResponse } from "next/server"
import { utenteDa } from "@/lib/auth/guardia"
import { destinazione, urlSuite } from "@/lib/auth/origine"
import { NOME_COOKIE, opzioniCookie } from "@/lib/auth/sessione"
import { registraAttivita } from "@/lib/db/registro"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// L'accesso avviene solo dalla suite. Qui resta l'uscita, che riporta alla suite.
export async function POST(request: Request) {
  const utente = utenteDa(request)
  if (utente) await registraAttivita(utente, "uscita").catch(() => {})
  const suite = urlSuite()
  const risposta = NextResponse.redirect(utente ? `${suite}/` : destinazione(request, "/accesso").toString(), 303)
  risposta.cookies.set(NOME_COOKIE, "", { ...opzioniCookie(), maxAge: 0 })
  return risposta
}
