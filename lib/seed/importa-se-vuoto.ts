import fs from "node:fs"
import path from "node:path"
import type { Client } from "@libsql/client"
import { eseguiImport } from "@/lib/import/esegui-import"

export function percorsoCsvIniziale(): string {
  return path.join(process.cwd(), "data", "StampaRicerca.csv")
}

export async function importaSeVuoto(client: Client): Promise<void> {
  const conteggio = await client.execute("SELECT COUNT(*) AS n FROM pagamenti")
  if (Number(conteggio.rows[0]?.n ?? 0) > 0) return
  const csv = percorsoCsvIniziale()
  if (!fs.existsSync(csv)) return
  await eseguiImport(client, fs.readFileSync(csv, "utf8"))
}
