import { NextResponse } from "next/server"
import { bloccaSeChiuso } from "@/lib/auth/guardia"
import { dbPronto, messaggioDatabase } from "@/lib/db/client"
import { applicaVista, righeAnno } from "@/lib/export/leggi"
import { creaPdf } from "@/lib/export/pdf"
import { fogliExport } from "@/lib/export/tabelle"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const blocco = bloccaSeChiuso(request)
  if (blocco) return blocco

  const url = new URL(request.url)
  const anno = url.searchParams.get("anno") ?? ""
  try {
    const client = await dbPronto()
    const dellAnno = await righeAnno(client, anno)
    if (!dellAnno) return NextResponse.json({ errore: "Anno scolastico non valido." }, { status: 400 })
    const elenco = applicaVista(dellAnno, url.searchParams.get("filtro"), url.searchParams.get("q") ?? "")
    const corpo = creaPdf(`Buoni mensa ${anno}`, fogliExport(elenco, dellAnno))
    return new NextResponse(Buffer.from(corpo), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="mensa-${anno.replace("/", "-")}.pdf"`,
      },
    })
  } catch (errore) {
    const messaggio = messaggioDatabase(errore)
    if (messaggio) return NextResponse.json({ errore: messaggio }, { status: 503 })
    console.error("Export PDF non riuscito")
    return NextResponse.json({ errore: "Export PDF non riuscito." }, { status: 500 })
  }
}
