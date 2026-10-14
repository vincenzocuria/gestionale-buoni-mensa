import { NextResponse } from "next/server"
import { destinazione } from "@/lib/auth/origine"
import { creaTokenSessione, NOME_COOKIE, opzioniCookie } from "@/lib/auth/sessione"
import { verificaTokenSuite } from "@/lib/auth/sso-suite"
import { consumaJti, registraAttivita } from "@/lib/db/registro"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Ingresso dalla Suite comunale: token Ed25519 monouso con l'identità dell'utente.
export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("t") ?? ""
    const dati = verificaTokenSuite(token)
    if (!dati) {
      await registraAttivita(null, "accesso.suite", "negato", { motivo: "token_non_valido" })
      return NextResponse.redirect(destinazione(request, "/accesso?errore=link"), 303)
    }
    if (!(await consumaJti(dati.jti, dati.exp))) {
      await registraAttivita(dati, "accesso.suite", "negato", { motivo: "token_gia_usato", jti: dati.jti })
      return NextResponse.redirect(destinazione(request, "/accesso?errore=link"), 303)
    }
    const sessione = creaTokenSessione({ sub: dati.sub, email: dati.email, nome: dati.nome, ruolo_modulo: dati.ruolo_modulo })
    await registraAttivita(dati, "accesso.suite", "ok", { jti: dati.jti, ruolo_modulo: dati.ruolo_modulo })
    const r = new URL(request.url).searchParams.get("r") ?? "/"
    const ritorno = r.startsWith("/") && !r.startsWith("//") && !r.startsWith("/\\") && !r.startsWith("/api/") ? r : "/"
    const risposta = NextResponse.redirect(destinazione(request, ritorno), 303)
    risposta.headers.set("Referrer-Policy", "no-referrer")
    risposta.cookies.set(NOME_COOKIE, sessione, opzioniCookie())
    return risposta
  } catch (errore) {
    console.error("Errore accesso dalla suite:", errore instanceof Error ? errore.message : "")
    return NextResponse.redirect(destinazione(request, "/accesso?errore=config"), 303)
  }
}
