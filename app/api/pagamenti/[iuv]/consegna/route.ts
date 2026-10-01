import { NextResponse } from "next/server"
import { bloccaSeChiuso } from "@/lib/auth/guardia"
import { applicaConsegna } from "@/lib/consegna/applica"
import { dbPronto, messaggioDatabase } from "@/lib/db/client"
import { leggiPerIuv, salvaConsegna } from "@/lib/db/pagamenti"
import type { AzioneConsegna } from "@/lib/pagamenti/tipi"
import { aVista } from "@/lib/pagamenti/vista"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const AZIONI: AzioneConsegna[] = ["completa", "parziale", "annulla"]

export async function POST(
  request: Request,
  contesto: { params: Promise<{ iuv: string }> },
) {
  const blocco = bloccaSeChiuso(request)
  if (blocco) return blocco

  const { iuv: iuvGrezzo } = await contesto.params
  const iuv = decodeURIComponent(iuvGrezzo)
  const corpo = await request.json().catch(() => null)
  const azione = corpo && typeof corpo === "object" ? corpo.azione : null
  if (!eAzione(azione)) {
    return NextResponse.json({ errore: "Azione non riconosciuta." }, { status: 400 })
  }

  try {
    const client = await dbPronto()
    const pagamento = await leggiPerIuv(client, iuv)
    if (!pagamento) {
      return NextResponse.json({ errore: "Bollettino non trovato." }, { status: 404 })
    }

    const esito = applicaConsegna(pagamento, azione)
    if (!esito.ok) {
      return NextResponse.json({ errore: esito.messaggio }, { status: 409 })
    }

    await salvaConsegna(client, iuv, esito.record.blocchettiConsegnati)
    return NextResponse.json({ riga: aVista(esito.record) })
  } catch (errore) {
    const messaggio = messaggioDatabase(errore)
    if (messaggio) return NextResponse.json({ errore: messaggio }, { status: 503 })
    console.error("Consegna non riuscita", errore instanceof Error ? errore.name : "")
    return NextResponse.json({ errore: "Consegna non riuscita." }, { status: 500 })
  }
}

function eAzione(valore: unknown): valore is AzioneConsegna {
  return typeof valore === "string" && AZIONI.includes(valore as AzioneConsegna)
}
