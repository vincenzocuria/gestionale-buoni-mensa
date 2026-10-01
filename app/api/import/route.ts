import { NextResponse } from "next/server"
import { bloccaSeChiuso } from "@/lib/auth/guardia"
import { dbPronto, messaggioDatabase } from "@/lib/db/client"
import { eseguiImport, messaggioImport } from "@/lib/import/esegui-import"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const blocco = bloccaSeChiuso(request)
  if (blocco) return blocco

  const csv = await leggiCsv(request)
  if (csv == null) {
    return NextResponse.json({ errore: "Seleziona un file CSV Siscom." }, { status: 400 })
  }
  if (!csv.trim()) {
    return NextResponse.json({ errore: "Il file CSV è vuoto." }, { status: 400 })
  }
  if (csv.length > 5_000_000) {
    return NextResponse.json({ errore: "Il file è troppo grande." }, { status: 400 })
  }

  try {
    const client = await dbPronto()
    const riepilogo = await eseguiImport(client, csv)
    return NextResponse.json(riepilogo)
  } catch (errore) {
    const messaggio = messaggioImport(errore) ?? messaggioDatabase(errore)
    if (messaggio) {
      const stato = messaggioDatabase(errore) ? 503 : 400
      return NextResponse.json({ errore: messaggio }, { status: stato })
    }
    console.error("Import non riuscito")
    return NextResponse.json({ errore: "Import non riuscito." }, { status: 500 })
  }
}

async function leggiCsv(request: Request): Promise<string | null> {
  const tipo = request.headers.get("content-type") ?? ""
  if (tipo.includes("multipart/form-data")) {
    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof File)) return null
    return file.text()
  }
  return request.text()
}
