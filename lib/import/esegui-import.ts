import { etichettaImportabile } from "@/lib/anno-scolastico/calcola"
import { ErroreCsv } from "@/lib/csv/errore-csv"
import { parseStampaRicerca } from "@/lib/csv/parse-stampa-ricerca"
import type { Sql } from "@/lib/db/client"
import { aggiorna, inserisci, leggiPerIuv } from "@/lib/db/pagamenti"
import { applicaMerge } from "@/lib/import/merge-incrementale"
import { contaEsito, riepilogoVuoto } from "@/lib/import/riepilogo"
import type { RiepilogoImport } from "@/lib/pagamenti/tipi"

export async function eseguiImport(client: Sql, csv: string): Promise<RiepilogoImport> {
  const lettura = parseStampaRicerca(csv)
  const riepilogo = riepilogoVuoto()
  riepilogo.righeLette = lettura.righeLette
  riepilogo.errori = lettura.errori

  await client.begin(async (transazione) => {
    // Un import alla volta (come il lock di scrittura di SQLite): due import
    // concorrenti dello stesso file non si contendono gli stessi IUV.
    await transazione`SELECT pg_advisory_xact_lock(hashtext('mensa.import'))`
    for (const riga of lettura.righe) {
      if (!etichettaImportabile(riga)) {
        riepilogo.fuoriPeriodo += 1
        continue
      }
      const esistente = await leggiPerIuv(transazione, riga.iuv, { perAggiornare: true })
      const { esito, record } = applicaMerge(esistente, riga)
      contaEsito(riepilogo, esito)
      if (!record) continue
      if (esito === "nuovo") await inserisci(transazione, record)
      else if (esito === "aggiornato") await aggiorna(transazione, record)
    }
  })

  return riepilogo
}

export function messaggioImport(errore: unknown): string | null {
  if (errore instanceof ErroreCsv) return errore.message
  return null
}
