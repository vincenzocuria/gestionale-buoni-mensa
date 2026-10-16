import { getClient } from "@/lib/db/client"

// Registro attività del modulo (chi ha fatto cosa) e token della suite già usati.
// Le tabelle sono create da db/migrazioni/002_accesso_suite.sql.

export async function registraAttivita(
  utente: { sub: string; nome_utente?: string; email?: string } | null,
  azione: string,
  esito: "ok" | "negato" | "errore" = "ok",
  dettagli: Record<string, unknown> = {},
): Promise<void> {
  await getClient()`
    insert into registro_attivita (utente_id, email, azione, esito, dettagli)
    values (${utente?.sub ?? null}, ${utente?.email ?? utente?.nome_utente ?? null}, ${azione}, ${esito}, ${JSON.stringify(dettagli)})`
}

// true se il token non era mai stato usato (e ora risulta usato).
export async function consumaJti(jti: string, scadeSecondi: number): Promise<boolean> {
  const sql = getClient()
  await sql`delete from sso_usati where scade < ${Math.floor(Date.now() / 1000) - 3600}`
  const esito = await sql`insert into sso_usati (jti, scade) values (${jti}, ${Math.floor(scadeSecondi)}) on conflict (jti) do nothing`
  return esito.count === 1
}
