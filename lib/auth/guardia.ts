import { NextResponse } from "next/server"
import { NOME_COOKIE, sessioneValida } from "@/lib/auth/sessione"

export function bloccaSeChiuso(request: Request): NextResponse | null {
  if (sessioneDaRichiesta(request)) return null
  return NextResponse.json({ errore: "Accesso richiesto." }, { status: 401 })
}

export function sessioneDaRichiesta(request: Request): boolean {
  const header = request.headers.get("cookie")
  if (!header) return false
  const trovato = header
    .split(";")
    .map((parte) => parte.trim())
    .find((parte) => parte.startsWith(`${NOME_COOKIE}=`))
  if (!trovato) return false
  const valore = decodeURIComponent(trovato.slice(NOME_COOKIE.length + 1))
  return sessioneValida(valore)
}
