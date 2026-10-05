import { NextResponse } from "next/server"
import { analizzaBlocchetti, pianoConsegnaGruppo } from "@/lib/audit/gruppi"
import { pianoOrarioGruppo } from "@/lib/consegna/gruppo"
import { leggiCorpoConsegna } from "@/lib/consegna/richiesta"
import { adessoLocale } from "@/lib/consegna/tempi"
import { bloccaSeChiuso } from "@/lib/auth/guardia"
import { dbPronto, messaggioDatabase } from "@/lib/db/client"
import { leggiTutti, salvaConsegna } from "@/lib/db/pagamenti"
import { aVista } from "@/lib/pagamenti/vista"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const blocco = bloccaSeChiuso(request)
  if (blocco) return blocco

  const corpo = await request.json().catch(() => null)
  const id = corpo && typeof corpo === "object" ? String((corpo as { id?: unknown }).id ?? "") : ""
  const letto = leggiCorpoConsegna(corpo)
  if (!id || !letto) {
    return NextResponse.json({ errore: "Richiesta non valida." }, { status: 400 })
  }

  try {
    const client = await dbPronto()
    const viste = (await leggiTutti(client)).map(aVista)
    const gruppo = analizzaBlocchetti(viste).gruppi.find((voce) => voce.id === id && voce.esito === "accorpato")
    if (!gruppo) return NextResponse.json({ errore: "Accorpamento non trovato." }, { status: 404 })

    const esito =
      letto.azione === "modifica" || letto.azione === "rimuovi" || letto.azione === "registra"
        ? pianoOrarioGruppo(gruppo, letto.azione, letto.indice, letto.quando)
        : { ok: true as const, piano: pianoConsegnaGruppo(gruppo, letto.azione, adessoLocale()) }
    if (!esito.ok) return NextResponse.json({ errore: esito.messaggio }, { status: 409 })

    const transazione = await client.transaction("write")
    try {
      for (const voce of esito.piano) await salvaConsegna(transazione, voce.iuv, voce.consegnati, voce.consegneIl)
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
