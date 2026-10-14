// Solo sviluppo: se il registro è vuoto importa data/StampaRicerca.csv
// (export Siscom locale, fuori da git perché contiene codici fiscali).
//   npm run sviluppo:importa
// In produzione i dati arrivano dal pulsante «Importa CSV» o dall'importatore.
import fs from "node:fs"
import path from "node:path"
import { creaSql, urlDatabase } from "../lib/db/client"
import { eseguiImport } from "../lib/import/esegui-import"

if (process.env.NODE_ENV === "production") {
  console.error("Script riservato allo sviluppo: non va eseguito in produzione.")
  process.exit(1)
}

async function main(): Promise<void> {
  const csv = path.join(process.cwd(), "data", "StampaRicerca.csv")
  const sql = creaSql(urlDatabase(), 1)

  try {
    const [{ n }] = await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM pagamenti`
    if (n > 0) {
      console.log(`Il registro contiene già ${n} bollettini: nessun import.`)
    } else if (!fs.existsSync(csv)) {
      console.log("Nessun file data/StampaRicerca.csv da importare.")
    } else {
      const riepilogo = await eseguiImport(sql, fs.readFileSync(csv, "utf8"))
      console.log(`Importati ${riepilogo.nuovi} bollettini.`)
    }
  } finally {
    await sql.end()
  }
}

main().catch((errore: unknown) => {
  console.error(errore instanceof Error ? errore.message : errore)
  process.exit(1)
})
