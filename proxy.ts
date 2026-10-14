import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { NOME_COOKIE, RINNOVO_API_SECONDI, RINNOVO_PAGINE_SECONDI, daRinnovare, leggiSessione } from "@/lib/auth/sessione"

// Pagine raggiungibili senza sessione: accesso dalla suite, uscita, salute per Coolify, privacy.
function pubblico(pathname: string): boolean {
  return (
    pathname === "/accesso" ||
    pathname === "/api/accesso" ||
    pathname === "/api/accesso/link" ||
    pathname === "/api/salute" ||
    pathname === "/privacy"
  )
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessione = leggiSessione(request.cookies.get(NOME_COOKIE)?.value)

  if (pubblico(pathname)) {
    if (pathname === "/accesso" && sessione && request.method === "GET") {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  if (sessione) {
    if (pathname.startsWith("/api/")) {
      if (daRinnovare(sessione, RINNOVO_API_SECONDI)) {
        return NextResponse.json({ errore: "Sessione da rinnovare: ricarica la pagina." }, { status: 401 })
      }
    } else if (request.method === "GET" && daRinnovare(sessione, RINNOVO_PAGINE_SECONDI)) {
      // Ogni 15 minuti si ripassa dalla suite, che ricontrolla utente e permessi.
      const suite = (process.env.SUITE_URL ?? "https://suite.vcuria.app").replace(/\/$/, "")
      const ritorno = `${pathname}${request.nextUrl.search}`
      return NextResponse.redirect(`${suite}/vai/mensa?r=${encodeURIComponent(ritorno)}`, 303)
    }
    return NextResponse.next()
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ errore: "Accesso richiesto." }, { status: 401 })
  }

  return NextResponse.redirect(new URL("/accesso", request.url))
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
