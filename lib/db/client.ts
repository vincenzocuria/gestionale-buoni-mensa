import postgres from "postgres"

// Connessione al Postgres self-hosted del Comune con il ruolo dedicato mensa_app
// (search_path = mensa). Lo schema si crea con le migrazioni (npm run migra):
// a runtime l'app esegue solo DML. In LAN non serve TLS; impostare
// MENSA_DATABASE_SSL=require se il database è raggiunto da una rete non fidata.

export type Sql = postgres.Sql
/** Connessione o transazione aperta con `sql.begin`: entrambe eseguono query. */
export type Esecutore = postgres.Sql | postgres.TransactionSql

type GlobaleMensa = typeof globalThis & {
  mensaSql?: postgres.Sql
}

const globale = globalThis as GlobaleMensa

const MESSAGGIO_NON_CONFIGURATO = "Database non configurato: manca MENSA_DATABASE_URL."

export function urlDatabase(): string {
  const url = process.env.MENSA_DATABASE_URL?.trim()
  if (!url) throw new Error(MESSAGGIO_NON_CONFIGURATO)
  return url
}

export function creaSql(url: string, max = Number(process.env.MENSA_DATABASE_POOL ?? 5)): postgres.Sql {
  return postgres(url, {
    max: Number.isFinite(max) && max > 0 ? max : 5,
    idle_timeout: 30,
    connect_timeout: 10,
    ssl: process.env.MENSA_DATABASE_SSL === "require" ? "require" : false,
    connection: { search_path: "mensa", application_name: "mensa" },
    transform: { undefined: null },
    onnotice: () => {},
  })
}

export function getClient(): postgres.Sql {
  globale.mensaSql ??= creaSql(urlDatabase())
  return globale.mensaSql
}

/** Mantenuta per compatibilità con le route: lo schema è già pronto grazie alle migrazioni. */
export async function dbPronto(): Promise<postgres.Sql> {
  return getClient()
}

export function messaggioDatabase(errore: unknown): string | null {
  if (!(errore instanceof Error)) return null
  if (errore.message.startsWith("Database non configurato")) return errore.message
  return null
}
