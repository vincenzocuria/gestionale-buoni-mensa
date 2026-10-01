"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { NOME_COOKIE, opzioniCookie, passwordCorretta, tokenSessione } from "@/lib/auth/sessione"

export async function entra(
  _stato: { errore: string } | null,
  form: FormData,
): Promise<{ errore: string }> {
  const inserita = String(form.get("password") ?? "")
  if (!passwordCorretta(inserita)) {
    return {
      errore: process.env.UFFICIO_PASSWORD
        ? "Password non corretta."
        : "Accesso non configurato: manca UFFICIO_PASSWORD.",
    }
  }

  const token = tokenSessione()
  if (!token) {
    return { errore: "Accesso non configurato: manca UFFICIO_PASSWORD." }
  }

  const jar = await cookies()
  jar.set(NOME_COOKIE, token, opzioniCookie())
  redirect("/")
}

export async function esci(): Promise<void> {
  const jar = await cookies()
  jar.delete(NOME_COOKIE)
  redirect("/accesso")
}
