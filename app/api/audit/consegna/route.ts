import { NextResponse } from "next/server"
import { analizzaBlocchetti, pianoConsegnaGruppo } from "@/lib/audit/gruppi"
import { bloccaSeChiuso } from "@/lib/auth/guardia"
import { dbPronto, messaggioDatabase } from "@/lib/db/client"
import { leggiTutti, salvaConsegna } from "@/lib/db/pagamenti"
import { aVista } from "@/lib/pagamenti/vista"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const AZIONI = ["completa", "parziale", "annulla"] as const
type Azione = (typeof AZIONI)[number]

export async function POST(request: Request) {
  const blocco = bloccaSeChiuso(request)
  if (blocco) return blocco

  const corpo = await request.json().catch(() => null)
  const id = corpo && typeof corpo === "object" ? String(corpo.id ?? "") : ""
  const azione = corpo && typeof corpo === "object" ? corpo.azione : null
  if (!id || !eAzione(azione)) {
    return NextResponse.json({ errore: "Richiesta non valida." }, { status: 400 })
  }

  try {
    const client = await dbPronto()
    const viste = (await leggiTutti(client)).map(aVista)
    const gruppo = analizzaBlocchetti(viste).gruppi.find((voce) => voce.id === id && voce.esito === "accorpato")
    if (!gruppo) return NextResponse.json({ errore: "Accorpamento non trovato." }, { status: 404 })

    const piano = pianoConsegnaGruppo(gruppo, azione)
    const transazione = await client.transaction("write")
    try {
      for (const voce of piano) await salvaConsegna(transazione, voce.iuv, voce.consegnati)
      await transazione.commit()
    } catch (errore) {
      await transazione.rollback()
      throw errore
    } finally {
      transazione.close()
    }
    return NextResponse.json({ ok: true })
  } catch (errore) {
    const messaggio = messaggioDatabase(errore)
    if (messaggio) return NextResponse.json({ errore: messaggio }, { status: 503 })
    console.error("Consegna audit non riuscita")
    return NextResponse.json({ errore: "Consegna non riuscita." }, { status: 500 })
  }
}

function eAzione(valore: unknown): valore is Azione {
  return typeof valore === "string" && AZIONI.includes(valore as Azione)
}
