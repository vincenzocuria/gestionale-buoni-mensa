import { NextResponse } from "next/server"
import { eAnnoImportato } from "@/lib/anno-scolastico/calcola"
import { bloccaSeChiuso } from "@/lib/auth/guardia"
import { dbPronto, messaggioDatabase } from "@/lib/db/client"
import { leggiTutti } from "@/lib/db/pagamenti"
import { eFiltroElenco, filtraPagamenti } from "@/lib/pagamenti/filtra"
import { calcolaKpi } from "@/lib/pagamenti/kpi"
import { aVista } from "@/lib/pagamenti/vista"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const blocco = bloccaSeChiuso(request)
  if (blocco) return blocco

  try {
    const client = await dbPronto()
    const viste = (await leggiTutti(client)).map(aVista).filter((riga) => eAnnoImportato(riga.annoScolastico))
    const url = new URL(request.url)
    const filtroParam = url.searchParams.get("filtro")
    const filtro = eFiltroElenco(filtroParam) ? filtroParam : "tutti"
    const ricerca = url.searchParams.get("q") ?? ""
    return NextResponse.json({
      righe: filtraPagamenti(viste, filtro, ricerca),
      kpi: calcolaKpi(viste),
    })
  } catch (errore) {
    const messaggio = messaggioDatabase(errore)
    if (messaggio) return NextResponse.json({ errore: messaggio }, { status: 503 })
    console.error("Lettura registro non riuscita", errore instanceof Error ? errore.name : "")
    return NextResponse.json({ errore: "Non riesco a leggere il registro." }, { status: 500 })
  }
}
