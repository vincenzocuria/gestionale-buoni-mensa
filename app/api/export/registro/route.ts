import { NextResponse } from "next/server"
import { richiediLettura } from "@/lib/auth/guardia"
import { dbPronto, messaggioDatabase } from "@/lib/db/client"
import { righeAnno } from "@/lib/export/leggi"
import { creaPdfRegistro } from "@/lib/export/pdf-registro"
import { righeRegistro } from "@/lib/export/registro-consegne"
import { formatDataIt } from "@/lib/format/data-it"
import { leggiPeriodo, type Periodo } from "@/lib/pagamenti/periodo"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Registro cartaceo da stampare: i blocchetti da consegnare (ed eventualmente le anomalie) con spazio per data e firma. */
export async function GET(request: Request) {
  const utente = richiediLettura(request)
  if (utente instanceof NextResponse) return utente

  const url = new URL(request.url)
  const anno = url.searchParams.get("anno") ?? ""
  const anomalie = url.searchParams.get("anomalie") === "1"
  const ricerca = (url.searchParams.get("q") ?? "").trim()
  const periodo = leggiPeriodo(url.searchParams)
  try {
    const client = await dbPronto()
    const dellAnno = await righeAnno(client, anno)
    if (!dellAnno) return NextResponse.json({ errore: "Anno scolastico non valido." }, { status: 400 })
    const righe = righeRegistro(dellAnno, { anomalie, ricerca, periodo })
    const corpo = creaPdfRegistro(righe, {
      annoScolastico: anno,
      contenuto: anomalie ? "Blocchetti da consegnare e anomalie" : "Solo blocchetti da consegnare",
      filtri: testoFiltri(ricerca, periodo),
      stampatoIl: new Date(),
    })
    return new NextResponse(Buffer.from(corpo), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="registro-consegne-${anno.replace("/", "-")}.pdf"`,
        "cache-control": "no-store",
      },
    })
  } catch (errore) {
    const messaggio = messaggioDatabase(errore)
    if (messaggio) return NextResponse.json({ errore: messaggio }, { status: 503 })
    console.error("Stampa registro non riuscita")
    return NextResponse.json({ errore: "Stampa del registro non riuscita." }, { status: 500 })
  }
}

function testoFiltri(ricerca: string, periodo: Periodo): string | null {
  const parti: string[] = []
  if (ricerca) parti.push(`ricerca «${ricerca}»`)
  if (periodo.dal || periodo.al) {
    const campo = periodo.campo === "scadenza" ? "scadenza" : "pagamento"
    const dal = periodo.dal ? ` dal ${formatDataIt(periodo.dal)}` : ""
    const al = periodo.al ? ` al ${formatDataIt(periodo.al)}` : ""
    parti.push(`${campo}${dal}${al}`)
  }
  return parti.length > 0 ? parti.join(" · ") : null
}
