import { NextResponse } from "next/server"
import { NOME_COOKIE, RINNOVO_API_SECONDI, daRinnovare, leggiSessione, type DatiSessione } from "@/lib/auth/sessione"
import { registraAttivita } from "@/lib/db/registro"

function cookieDa(request: Request): string | undefined {
  const intestazione = request.headers.get("cookie") ?? ""
  for (const parte of intestazione.split(";")) {
    const [nome, ...valore] = parte.trim().split("=")
    if (nome === NOME_COOKIE) return decodeURIComponent(valore.join("="))
  }
  return undefined
}

export function utenteDa(request: Request): DatiSessione | null {
  return leggiSessione(cookieDa(request))
}

// Per le API di sola lettura: serve una sessione valida e non da rinnovare.
export function richiediLettura(request: Request): DatiSessione | NextResponse {
  const utente = utenteDa(request)
  if (!utente) return NextResponse.json({ errore: "Accesso richiesto." }, { status: 401 })
  if (daRinnovare(utente, RINNOVO_API_SECONDI)) {
    return NextResponse.json({ errore: "Sessione da rinnovare: ricarica la pagina." }, { status: 401 })
  }
  return utente
}

// Per le API che modificano i dati: serve un ruolo diverso da "lettura".
// Restituisce l'utente oppure la risposta di errore da inviare.
export async function richiediScrittura(request: Request, azione: string): Promise<DatiSessione | NextResponse> {
  const utente = richiediLettura(request)
  if (utente instanceof NextResponse) return utente
  if (utente.ruolo_modulo === "lettura") {
    await registraAttivita(utente, azione, "negato", { motivo: "sola_lettura" }).catch(() => {})
    return NextResponse.json({ errore: "Il tuo account è abilitato in sola lettura." }, { status: 403 })
  }
  return utente
}
