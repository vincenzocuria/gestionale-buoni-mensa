import { NextResponse } from "next/server"
import { bloccaSeChiuso } from "@/lib/auth/guardia"
import { applicaConsegna } from "@/lib/consegna/applica"
import { applicaOrario } from "@/lib/consegna/modifica"
import { leggiCorpoConsegna } from "@/lib/consegna/richiesta"
import { adessoLocale } from "@/lib/consegna/tempi"
import { dbPronto, messaggioDatabase } from "@/lib/db/client"
import { leggiPerIuv, salvaConsegna } from "@/lib/db/pagamenti"
import { aVista } from "@/lib/pagamenti/vista"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  request: Request,
  contesto: { params: Promise<{ iuv: string }> },
) {
  const blocco = bloccaSeChiuso(request)
  if (blocco) return blocco

  const { iuv: iuvGrezzo } = await contesto.params
  const iuv = decodeURIComponent(iuvGrezzo)
  const letto = leggiCorpoConsegna(await request.json().catch(() => null))
  if (!letto) {
    return NextResponse.json({ errore: "Azione non riconosciuta." }, { status: 400 })
  }

  try {
    const client = await dbPronto()
    const pagamento = await leggiPerIuv(client, iuv)
    if (!pagamento) {
      return NextResponse.json({ errore: "Bollettino non trovato." }, { status: 404 })
    }

    const esito =
      letto.azione === "modifica" || letto.azione === "rimuovi" || letto.azione === "registra"
        ? applicaOrario(pagamento, letto.azione, letto.indice, letto.quando)
        : applicaConsegna(pagamento, letto.azione, adessoLocale())
    if (!esito.ok) {
      return NextResponse.json({ errore: esito.messaggio }, { status: 409 })
    }

    await salvaConsegna(client, iuv, esito.record.blocchettiConsegnati, esito.record.consegneIl)
    return NextResponse.json({ riga: aVista(esito.record) })
  } catch (errore) {
    const messaggio = messaggioDatabase(errore)
    if (messaggio) return NextResponse.json({ errore: messaggio }, { status: 503 })
    console.error("Consegna non riuscita", errore instanceof Error ? errore.name : "")
    return NextResponse.json({ errore: "Consegna non riuscita." }, { status: 500 })
  }
}
