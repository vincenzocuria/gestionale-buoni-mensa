import type { Client } from "@libsql/client"
import { etichettaImportabile } from "@/lib/anno-scolastico/calcola"

export async function assicuraAnnoScolastico(client: Client): Promise<void> {
  const info = await client.execute("PRAGMA table_info(pagamenti)")
  const presente = info.rows.some((riga) => String(riga.name) === "anno_scolastico")
  if (!presente) {
    await client.execute("ALTER TABLE pagamenti ADD COLUMN anno_scolastico TEXT NOT NULL DEFAULT ''")
  }

  const vuoti = await client.execute(
    "SELECT iuv, data_scadenza, data_emissione, data_pagamento FROM pagamenti WHERE anno_scolastico = ''",
  )
  for (const riga of vuoti.rows) {
    const etichetta = etichettaImportabile({
      dataScadenza: testo(riga.data_scadenza),
      dataEmissione: testo(riga.data_emissione),
      dataPagamento: testo(riga.data_pagamento),
    })
    if (!etichetta) continue
    await client.execute({
      sql: "UPDATE pagamenti SET anno_scolastico = ? WHERE iuv = ?",
      args: [etichetta, String(riga.iuv)],
    })
  }
}

function testo(valore: unknown): string | null {
  if (valore == null || valore === "") return null
  return String(valore)
}
