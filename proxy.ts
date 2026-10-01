import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { NOME_COOKIE, sessioneValida } from "@/lib/auth/sessione"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const valida = sessioneValida(request.cookies.get(NOME_COOKIE)?.value)

  if (pathname === "/accesso") {
    if (valida) return NextResponse.redirect(new URL("/", request.url))
    return NextResponse.next()
  }

  if (valida) return NextResponse.next()

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ errore: "Accesso richiesto." }, { status: 401 })
  }

  const destinazione = new URL("/accesso", request.url)
  return NextResponse.redirect(destinazione)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
