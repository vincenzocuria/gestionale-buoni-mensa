// Test sul database reale (in CI con un Postgres 16 di servizio).
// Richiedono TEST_DATABASE_ADMIN_URL; altrimenti vengono saltati.
import assert from "node:assert/strict"
import { after, before, test } from "node:test"
import { etichettaImportabile, eAnnoImportato } from "../lib/anno-scolastico/calcola"
import { applicaConsegna } from "../lib/consegna/applica"
import { inserisci, leggiPerIuv, leggiTutti, salvaConsegna } from "../lib/db/pagamenti"
import { creaExcel } from "../lib/export/excel"
import { applicaVista, righeAnno } from "../lib/export/leggi"
import { creaPdf } from "../lib/export/pdf"
import { fogliExport } from "../lib/export/tabelle"
import { eseguiImport } from "../lib/import/esegui-import"
import type { Pagamento } from "../lib/pagamenti/tipi"
import { aVista } from "../lib/pagamenti/vista"
import { creaDatabaseTest, migra, saltaDb, type DatabaseTest } from "./db-test"

let db: DatabaseTest

before(async () => {
  if (!saltaDb) db = await creaDatabaseTest("database")
})

after(async () => {
  if (!saltaDb) await db.chiudi()
})

const INTESTAZIONE =
  "Data scadenza;Data Pagamento;Servizio;Tipologia;Importo;Debitore;Accertamento anno;Accertamento numero;Reversale data;Reversale numero;Data emissione;IUV;PspRiferimento;Causale Pagamento;Cognome;Nome;Cod Fiscale"

function csv(righe: string[]): string {
  return [INTESTAZIONE, ...righe].join("\n")
}

async function svuota(): Promise<void> {
  await db.sql`DELETE FROM pagamenti`
}

function pagamento(iuv: string, campi: Partial<Pagamento> = {}): Pagamento {
  return {
    iuv,
    dataScadenza: "2026-10-16",
    dataPagamento: null,
    servizio: "MENSE",
    tipologia: "",
    importoCentesimi: 4000,
    debitore: "ROSSI MARIO",
    accertamentoAnno: "2026",
    accertamentoNumero: "1",
    reversaleData: null,
    reversaleNumero: "",
    dataEmissione: "2026-10-01",
    pspRiferimento: "",
    causale: "Mensa Scolastica",
    cognome: "ROSSI",
    nome: "MARIO",
    codiceFiscale: "AAA",
    annoScolastico: "2026/2027",
    tariffaRidotta: false,
    blocchettiDovuti: 1,
    blocchettiConsegnati: 0,
    consegneIl: [],
    ...campi,
  }
}

// Ordine che restituiva SQLite (lib/db/pagamenti.ts prima del passaggio a Postgres):
// confronto binario delle stringhe, NOCASE solo sulle lettere ASCII.
function ordineSqlite(a: Pagamento, b: Pagamento): number {
  const gruppo = (p: Pagamento) => (p.dataPagamento != null && p.blocchettiConsegnati < p.blocchettiDovuti ? 0 : p.dataPagamento == null ? 1 : 2)
  const binario = (x: string, y: string) => Buffer.compare(Buffer.from(x, "utf8"), Buffer.from(y, "utf8"))
  const nocase = (x: string) => x.replace(/[A-Z]/g, (c) => c.toLowerCase())
  return (
    gruppo(a) - gruppo(b) ||
    binario(b.dataPagamento ?? "", a.dataPagamento ?? "") ||
    binario(nocase(a.debitore), nocase(b.debitore)) ||
    binario(a.iuv, b.iuv)
  )
}

test("migrazioni: idempotenti e registrate", { skip: saltaDb }, async () => {
  migra(db.urlAdmin)
  migra(db.urlAdmin)
  const versioni = await db.admin<{ versione: string }[]>`select versione from mensa.migrazioni order by versione`
  assert.deepEqual(versioni.map((v) => v.versione), ["001_mensa", "002_accesso_suite"])
})

test("schema: nomi e tipi delle colonne per l'importatore", { skip: saltaDb }, async () => {
  const colonne = await db.admin<{ tabella: string; colonna: string; tipo: string; nullable: string }[]>`
    select table_name as tabella, column_name as colonna, data_type as tipo, is_nullable as nullable
    from information_schema.columns where table_schema = 'mensa'
    order by table_name, ordinal_position`
  const testo = colonne.map((c) => `${c.tabella}.${c.colonna}:${c.tipo}${c.nullable === "YES" ? "?" : ""}`)
  assert.deepEqual(testo, [
    "migrazioni.versione:text",
    "migrazioni.applicata_il:timestamp with time zone",
    "pagamenti.iuv:text",
    "pagamenti.data_scadenza:text?",
    "pagamenti.data_pagamento:text?",
    "pagamenti.servizio:text",
    "pagamenti.tipologia:text",
    "pagamenti.importo_centesimi:integer",
    "pagamenti.debitore:text",
    "pagamenti.accertamento_anno:text",
    "pagamenti.accertamento_numero:text",
    "pagamenti.reversale_data:text?",
    "pagamenti.reversale_numero:text",
    "pagamenti.data_emissione:text?",
    "pagamenti.psp_riferimento:text",
    "pagamenti.causale:text",
    "pagamenti.cognome:text",
    "pagamenti.nome:text",
    "pagamenti.codice_fiscale:text",
    "pagamenti.tariffa_ridotta:integer",
    "pagamenti.blocchetti_dovuti:integer",
    "pagamenti.blocchetti_consegnati:integer",
    "pagamenti.anno_scolastico:text",
    "pagamenti.consegne_il:text",
    "registro_attivita.id:bigint",
    "registro_attivita.ts:timestamp with time zone",
    "registro_attivita.utente_id:text?",
    "registro_attivita.email:text?",
    "registro_attivita.azione:text",
    "registro_attivita.esito:text",
    "registro_attivita.dettagli:text",
    "sso_usati.jti:text",
    "sso_usati.scade:bigint",
  ])
})

test("ruolo mensa_app: solo DML sullo schema mensa", { skip: saltaDb }, async () => {
  const [ruolo] = await db.admin<{ rolinherit: boolean; rolcanlogin: boolean; rolsuper: boolean; rolcreatedb: boolean; rolcreaterole: boolean }[]>`
    select rolinherit, rolcanlogin, rolsuper, rolcreatedb, rolcreaterole from pg_roles where rolname = 'mensa_app'`
  assert.deepEqual(ruolo, { rolinherit: false, rolcanlogin: true, rolsuper: false, rolcreatedb: false, rolcreaterole: false })

  await assert.rejects(db.sql`create table mensa.intrusa (id int)`, /permission denied/)
  await assert.rejects(db.sql`alter table pagamenti add column intrusa int`, /must be owner|permission denied/)
  await assert.rejects(db.sql`drop table registro_attivita`, /must be owner|permission denied/)
  await assert.rejects(db.sql`truncate pagamenti`, /permission denied/)
  await assert.rejects(db.sql`insert into migrazioni (versione) values ('999_intrusa')`, /permission denied/)
  await assert.rejects(db.sql`select mensa.compila_anno_scolastico()`, /permission denied/)
  await db.admin`create table if not exists public.altro_modulo (id int)`
  await assert.rejects(db.sql`select * from public.altro_modulo`, /permission denied/)

  const [{ percorso }] = await db.sql<{ percorso: string }[]>`select current_setting('search_path') as percorso`
  assert.equal(percorso, "mensa")
})

test("pagamenti: andata e ritorno senza perdite", { skip: saltaDb }, async () => {
  await svuota()
  const originale = pagamento("RT-1", {
    dataPagamento: "2026-10-02T09:00:00",
    reversaleData: "2026-10-05",
    reversaleNumero: "77",
    pspRiferimento: "PSP-À",
    debitore: "D'ANGELO ÀNGELA",
    tariffaRidotta: true,
    blocchettiDovuti: 3,
    blocchettiConsegnati: 2,
    consegneIl: ["2026-10-03T10:15:00", "2026-10-04T11:00:00"],
  })
  await inserisci(db.sql, originale)
  assert.deepEqual(await leggiPerIuv(db.sql, "RT-1"), originale)
  const [grezza] = await db.sql<{ tariffa_ridotta: number; consegne_il: string }[]>`
    select tariffa_ridotta, consegne_il from pagamenti where iuv = 'RT-1'`
  assert.equal(grezza.tariffa_ridotta, 1)
  assert.equal(grezza.consegne_il, '["2026-10-03T10:15:00","2026-10-04T11:00:00"]')
})

test("import Siscom: fusione sull'IUV, chiusi invariati, consegna non azzerata", { skip: saltaDb }, async () => {
  await svuota()
  const primo = await eseguiImport(
    db.sql,
    csv([
      "16/10/2026;;MENSE;;40,00;ROSSI MARIO;2026;1;;;01/10/2026;100;;Mensa Scolastica;ROSSI;MARIO;AAA",
      "16/10/2026;01/09/2026;MENSE;;80,00;BIANCHI LUCIA;2026;1;;;01/09/2026;200;;Mensa Scolastica;BIANCHI;LUCIA;BBB",
      "16/10/2026;01/09/2026;MENSE;;40,00;VERDI PIO;2026;1;;;01/09/2026;300;;Mensa Scolastica;VERDI;PIO;CCC",
      // Lo stesso IUV due volte nello stesso file: la seconda riga si fonde con la prima.
      "16/10/2026;;MENSE;;40,00;GIALLI EVA;2026;1;;;01/10/2026;400;;Mensa Scolastica;GIALLI;EVA;DDD",
      "16/10/2026;03/10/2026;MENSE;;40,00;GIALLI EVA;2026;1;;;01/10/2026;400;PSP-G;Mensa Scolastica;GIALLI;EVA;DDD",
    ]),
  )
  assert.deepEqual(
    { nuovi: primo.nuovi, aggiornati: primo.aggiornati, righeLette: primo.righeLette },
    { nuovi: 4, aggiornati: 1, righeLette: 5 },
  )
  assert.equal((await leggiPerIuv(db.sql, "400"))?.dataPagamento, "2026-10-03")

  // 200: consegna parziale; 300: bollettino chiuso (pagato e consegnato).
  const bianchi = await leggiPerIuv(db.sql, "200")
  const parziale = applicaConsegna(bianchi!, "parziale", "2026-10-01T11:30:00")
  assert.ok(parziale.ok)
  if (parziale.ok) await salvaConsegna(db.sql, "200", parziale.record.blocchettiConsegnati, parziale.record.consegneIl)
  const verdi = await leggiPerIuv(db.sql, "300")
  const completa = applicaConsegna(verdi!, "completa", "2026-10-02T16:05:00")
  assert.ok(completa.ok)
  if (completa.ok) await salvaConsegna(db.sql, "300", completa.record.blocchettiConsegnati, completa.record.consegneIl)
  const chiusoPrima = await leggiPerIuv(db.sql, "300")

  const secondo = await eseguiImport(
    db.sql,
    csv([
      "20/10/2026;02/10/2026 09:00:00;MENSE;;40,00;ROSSI MARIO;2026;9;;;02/10/2026;100;PSP-A;Mensa Scolastica;ROSSI;MARIO;AAA",
      "16/10/2026;01/09/2026;MENSE;;80,00;NOME CAMBIATO;2026;1;;99;01/09/2026;200;PSP-B;Mensa Scolastica;BIANCHI;LUCIA;BBB",
      "16/10/2026;01/09/2026;MENSE;;40,00;ALTRO NOME;2026;1;;55;01/09/2026;300;PSP-C;Mensa Scolastica;VERDI;PIO;CCC",
    ]),
  )
  assert.deepEqual(
    { aggiornati: secondo.aggiornati, ignorati: secondo.ignorati, nuovi: secondo.nuovi },
    { aggiornati: 2, ignorati: 1, nuovi: 0 },
  )
  const rossi = await leggiPerIuv(db.sql, "100")
  assert.equal(rossi?.dataPagamento, "2026-10-02T09:00:00")
  assert.equal(rossi?.accertamentoNumero, "9")
  const bianchiDopo = await leggiPerIuv(db.sql, "200")
  assert.equal(bianchiDopo?.blocchettiConsegnati, 1)
  assert.deepEqual(bianchiDopo?.consegneIl, ["2026-10-01T11:30:00"])
  assert.equal(bianchiDopo?.debitore, "BIANCHI LUCIA")
  assert.equal(bianchiDopo?.reversaleNumero, "99")
  assert.equal(bianchiDopo?.pspRiferimento, "PSP-B")
  assert.deepEqual(await leggiPerIuv(db.sql, "300"), chiusoPrima)
  assert.equal((await leggiTutti(db.sql)).length, 4)
})

test("import Siscom: due import concorrenti non si scontrano sugli stessi IUV", { skip: saltaDb }, async () => {
  await svuota()
  const file = csv(
    Array.from({ length: 30 }, (_, i) =>
      `16/10/2026;;MENSE;;40,00;PERSONA ${i};2026;1;;;01/10/2026;C${i};;Mensa Scolastica;PERSONA;${i};CF${i}`,
    ),
  )
  const [a, b] = await Promise.all([eseguiImport(db.sql, file), eseguiImport(db.sql, file)])
  assert.equal(a.nuovi + b.nuovi, 30)
  assert.equal(a.invariati + b.invariati, 30)
  assert.equal((await leggiTutti(db.sql)).length, 30)
})

test("export: stesso ordine di SQLite e stessi fogli Excel/PDF", { skip: saltaDb }, async () => {
  await svuota()
  const dati: Pagamento[] = [
    pagamento("10", { debitore: "bianchi anna", dataPagamento: "2026-10-02", blocchettiDovuti: 2, blocchettiConsegnati: 1 }),
    pagamento("9", { debitore: "Bianchi Anna", dataPagamento: "2026-10-02", blocchettiDovuti: 2 }),
    pagamento("A1", { debitore: "Ábaco Luigi", dataPagamento: "2026-10-02T08:00:00", blocchettiDovuti: 1 }),
    pagamento("A2", { debitore: "Zeta Ugo", dataPagamento: "2026-10-02T08:00:00", blocchettiDovuti: 1 }),
    pagamento("B1", { debitore: "rossi mario", dataPagamento: null }),
    pagamento("B2", { debitore: "ROSSI MARIO", dataPagamento: null }),
    pagamento("B3", { debitore: "", dataPagamento: null, dataScadenza: "2026-11-01" }),
    pagamento("C1", { debitore: "VERDI PIA", dataPagamento: "2026-09-15", blocchettiDovuti: 1, blocchettiConsegnati: 1, consegneIl: ["2026-09-16T10:00:00"] }),
    pagamento("C2", { debitore: "verdi pia", dataPagamento: "2026-09-15T17:30:00", blocchettiDovuti: 2, blocchettiConsegnati: 2, consegneIl: ["2026-09-16T10:00:00", "2026-09-17T10:00:00"], tariffaRidotta: true, importoCentesimi: 6000 }),
    pagamento("C3", { debitore: "Neri Ivo", dataPagamento: "2027-01-10", blocchettiDovuti: 0, blocchettiConsegnati: 0 }),
    pagamento("D1", { debitore: "Altro Anno", annoScolastico: "2027/2028", dataScadenza: "2027-10-01", dataEmissione: "2027-10-01" }),
  ]
  for (const voce of dati) await inserisci(db.sql, voce)

  const atteso = [...dati].sort(ordineSqlite)
  const letti = await leggiTutti(db.sql)
  assert.deepEqual(letti.map((p) => p.iuv), atteso.map((p) => p.iuv))
  assert.deepEqual(letti, atteso)

  const anno = "2026/2027"
  const dalDb = await righeAnno(db.sql, anno)
  assert.ok(dalDb)
  const inMemoria = atteso.map(aVista).filter((riga) => eAnnoImportato(riga.annoScolastico) && riga.annoScolastico === anno)
  assert.deepEqual(dalDb, inMemoria)

  for (const [filtro, ricerca] of [[null, ""], ["da_consegnare", ""], ["tutti", "rossi"], ["consegnati", "VERDI"]] as const) {
    const fogliDb = fogliExport(applicaVista(dalDb, filtro, ricerca), dalDb)
    const fogliAttesi = fogliExport(applicaVista(inMemoria, filtro, ricerca), inMemoria)
    assert.equal(creaExcel(fogliDb), creaExcel(fogliAttesi))
    assert.deepEqual(Buffer.from(creaPdf("Buoni mensa", fogliDb)), Buffer.from(creaPdf("Buoni mensa", fogliAttesi)))
  }
  assert.equal(await righeAnno(db.sql, "2025/2026"), null)
})

test("anno scolastico: la funzione SQL segue etichettaImportabile", { skip: saltaDb }, async () => {
  await svuota()
  const casi: Array<[string, string | null, string | null, string | null]> = [
    ["E1", "2026-10-16", "2026-01-01", null],
    ["E2", null, "2027-08-31", "2027-09-01"],
    ["E3", null, null, "2027-09-01T10:00:00"],
    ["E4", "2026-06-15", null, null],
    ["E5", null, null, null],
    ["E6", "16/10/2026", "2026-10-01", null],
    ["E7", "2026-13-01", null, null],
  ]
  for (const [iuv, dataScadenza, dataEmissione, dataPagamento] of casi) {
    await inserisci(db.sql, pagamento(iuv, { dataScadenza, dataEmissione, dataPagamento, annoScolastico: "" }))
  }
  const [{ n }] = await db.admin<{ n: number }[]>`select mensa.compila_anno_scolastico() as n`
  const attesi = casi.map(([, dataScadenza, dataEmissione, dataPagamento]) => etichettaImportabile({ dataScadenza, dataEmissione, dataPagamento }) ?? "")
  const letti = await Promise.all(casi.map(async ([iuv]) => (await leggiPerIuv(db.sql, iuv))?.annoScolastico))
  assert.deepEqual(letti, attesi)
  assert.equal(n, attesi.filter(Boolean).length)
})
