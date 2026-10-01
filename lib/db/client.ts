import fs from "node:fs"
import path from "node:path"
import { createClient, type Client } from "@libsql/client"
import { assicuraAnnoScolastico } from "@/lib/db/assicura-anno-scolastico"
import { assicuraConsegne } from "@/lib/db/assicura-consegne"
import { SCHEMA_SQL } from "@/lib/db/schema"
import { importaSeVuoto } from "@/lib/seed/importa-se-vuoto"

type GlobaleMensa = typeof globalThis & {
  mensaClient?: Client
  mensaPronto?: Promise<void>
}

const globale = globalThis as GlobaleMensa

export function configurazioneTurso(): { url: string; authToken: string } | null {
  const url = process.env.TURSO_DATABASE_URL?.trim()
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim()
  if (!url && !authToken) return null
  if (!url || !authToken) {
    throw new Error("Servono sia TURSO_DATABASE_URL sia TURSO_AUTH_TOKEN.")
  }
  return { url, authToken }
}

export function percorsoSqliteLocale(): string {
  return path.join(process.cwd(), "data", "mensa.sqlite")
}

export function creaClientLocale(file: string): Client {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const assoluto = path.resolve(file).replace(/\\/g, "/")
  return createClient({ url: `file:${assoluto}` })
}

export function getClient(): Client {
  if (!globale.mensaClient) {
    const turso = configurazioneTurso()
    if (!turso && process.env.VERCEL) {
      throw new Error("Database non configurato: servono TURSO_DATABASE_URL e TURSO_AUTH_TOKEN.")
    }
    globale.mensaClient = turso ? createClient(turso) : creaClientLocale(percorsoSqliteLocale())
    globale.mensaPronto = prepara(globale.mensaClient, turso == null)
  }
  return globale.mensaClient
}

export async function dbPronto(): Promise<Client> {
  const client = getClient()
  await globale.mensaPronto
  await assicuraConsegne(client)
  return client
}

export function messaggioDatabase(errore: unknown): string | null {
  if (!(errore instanceof Error)) return null
  if (errore.message.startsWith("Database non configurato")) return errore.message
  if (errore.message.startsWith("Servono sia TURSO")) return errore.message
  return null
}

async function prepara(client: Client, locale: boolean): Promise<void> {
  if (client.protocol === "file") {
    await client.execute("PRAGMA busy_timeout = 5000")
    await client.execute("PRAGMA journal_mode = WAL")
  }
  await client.executeMultiple(SCHEMA_SQL)
  await assicuraAnnoScolastico(client)
  await assicuraConsegne(client)
  if (locale) await importaSeVuoto(client)
}
