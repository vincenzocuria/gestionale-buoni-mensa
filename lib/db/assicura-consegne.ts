import type { Client } from "@libsql/client"

export async function assicuraConsegne(client: Client): Promise<void> {
  const info = await client.execute("PRAGMA table_info(pagamenti)")
  const presente = info.rows.some((riga) => String(riga.name) === "consegne_il")
  if (presente) return
  await client.execute("ALTER TABLE pagamenti ADD COLUMN consegne_il TEXT NOT NULL DEFAULT '[]'")
}
