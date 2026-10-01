import { NextResponse } from "next/server"
import { bloccaSeChiuso } from "@/lib/auth/guardia"
import { dbPronto, messaggioDatabase } from "@/lib/db/client"
import { creaExcel } from "@/lib/export/excel"
import { applicaVista, righeAnno } from "@/lib/export/leggi"
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
    const corpo = creaExcel(fogliExport(elenco, dellAnno))
    return new NextResponse(corpo, {
      headers: {
        "content-type": "application/vnd.ms-excel; charset=utf-8",
        "content-disposition": `attachment; filename="mensa-${anno.replace("/", "-")}.xls"`,
      },
    })
  } catch (errore) {
    const messaggio = messaggioDatabase(errore)
    if (messaggio) return NextResponse.json({ errore: messaggio }, { status: 503 })
    console.error("Export Excel non riuscito")
    return NextResponse.json({ errore: "Export Excel non riuscito." }, { status: 500 })
  }
}
