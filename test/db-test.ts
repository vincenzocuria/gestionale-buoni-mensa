// Database Postgres usa e getta per i test che toccano il database reale.
// Servono TEST_DATABASE_ADMIN_URL (utente amministratore); senza, i test vengono saltati.
// Ogni file di test crea il proprio database, vi applica le migrazioni con
// scripts/migra.mjs e si collega come mensa_app, cioè con i soli privilegi di produzione.
import { execFileSync } from "node:child_process"
import postgres from "postgres"
import { creaSql } from "../lib/db/client"

export const adminUrl = process.env.TEST_DATABASE_ADMIN_URL
export const saltaDb = !adminUrl

const PASSWORD_APP = "prova-mensa-app"

export type DatabaseTest = {
  /** Connessione come mensa_app (search_path = mensa). */
  sql: postgres.Sql
  /** Connessione come amministratore allo stesso database. */
  admin: postgres.Sql
  url: string
  urlAdmin: string
  chiudi(): Promise<void>
}

export function migra(urlAdmin: string, password?: string): void {
  execFileSync("node", ["scripts/migra.mjs"], {
    env: {
      ...process.env,
      MENSA_DATABASE_ADMIN_URL: urlAdmin,
      ...(password ? { MENSA_APP_DB_PASSWORD: password } : {}),
    },
    stdio: "pipe",
  })
}

export async function creaDatabaseTest(nome: string): Promise<DatabaseTest> {
  if (!adminUrl) throw new Error("TEST_DATABASE_ADMIN_URL non impostata")
  const database = `mensa_test_${nome}_${process.pid}`
  const server = postgres(adminUrl, { max: 1, onnotice: () => {} })
  await server.unsafe(`drop database if exists ${database} with (force)`)
  await server.unsafe(`create database ${database}`)
  await server.end()

  const urlAdmin = conDatabase(adminUrl, database)
  migra(urlAdmin, PASSWORD_APP)

  const app = new URL(urlAdmin)
  app.username = "mensa_app"
  app.password = PASSWORD_APP
  const url = app.toString()
  const sql = creaSql(url, 4)
  const admin = postgres(urlAdmin, { max: 1, onnotice: () => {} })

  return {
    sql,
    admin,
    url,
    urlAdmin,
    async chiudi() {
      await sql.end()
      await admin.end()
      const fine = postgres(adminUrl, { max: 1, onnotice: () => {} })
      await fine.unsafe(`drop database if exists ${database} with (force)`)
      await fine.end()
    },
  }
}

function conDatabase(url: string, database: string): string {
  const u = new URL(url)
  u.pathname = `/${database}`
  return u.toString()
}
