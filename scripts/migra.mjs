// Applica le migrazioni SQL in db/migrazioni (in ordine), registrandole in mensa.migrazioni.
// Va eseguito con un utente amministratore del database:
//   MENSA_DATABASE_ADMIN_URL=postgres://postgres:...@192.168.1.40:5432/postgres npm run migra
// Con MENSA_APP_DB_PASSWORD imposta anche la password del ruolo mensa_app.
import { readdir, readFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import postgres from "postgres"

const url = process.env.MENSA_DATABASE_ADMIN_URL
if (!url) {
  console.error("Imposta MENSA_DATABASE_ADMIN_URL (utente amministratore del database).")
  process.exit(1)
}

const cartella = join(dirname(fileURLToPath(import.meta.url)), "..", "db", "migrazioni")
const sql = postgres(url, {
  max: 1,
  onnotice: () => {},
  ssl: process.env.MENSA_DATABASE_SSL === "require" ? "require" : false,
})

try {
  const esiste = await sql`select to_regclass('mensa.migrazioni') is not null as c`
  const applicate = new Set(esiste[0].c ? (await sql`select versione from mensa.migrazioni`).map((r) => r.versione) : [])
  const file = (await readdir(cartella)).filter((f) => f.endsWith(".sql")).sort()
  for (const nome of file) {
    const versione = nome.replace(/\.sql$/, "")
    if (applicate.has(versione)) {
      console.log(`= ${versione} già applicata`)
      continue
    }
    const testo = await readFile(join(cartella, nome), "utf8")
    await sql.begin(async (tx) => {
      await tx.unsafe(testo)
      await tx`insert into mensa.migrazioni (versione) values (${versione}) on conflict do nothing`
    })
    console.log(`+ ${versione} applicata`)
  }
  if (process.env.MENSA_APP_DB_PASSWORD) {
    await sql.unsafe(`alter role mensa_app password '${process.env.MENSA_APP_DB_PASSWORD.replace(/'/g, "''")}'`)
    console.log("Password del ruolo mensa_app aggiornata.")
  }
} finally {
  await sql.end()
}
