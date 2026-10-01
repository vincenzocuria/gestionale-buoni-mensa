import assert from "node:assert/strict"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import test from "node:test"
import { applicaConsegna } from "../consegna/applica"
import { SCHEMA_SQL } from "../db/schema"
import { creaClientLocale } from "../db/client"
import { leggiPerIuv, leggiTutti, salvaConsegna } from "../db/pagamenti"
import { eseguiImport } from "../import/esegui-import"

const INTESTAZIONE =
  "Data scadenza;Data Pagamento;Servizio;Tipologia;Importo;Debitore;Accertamento anno;Accertamento numero;Reversale data;Reversale numero;Data emissione;IUV;PspRiferimento;Causale Pagamento;Cognome;Nome;Cod Fiscale"

function csv(righe: string[]): string {
  return [INTESTAZIONE, ...righe].join("\n")
}

test("il merge su sqlite non cancella, non azzera consegna e non pulisce la data", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "mensa-"))
  const client = creaClientLocale(path.join(dir, "mensa.sqlite"))
  try {
    await client.executeMultiple(SCHEMA_SQL)
    const primo = await eseguiImport(
      client,
      csv([
        "16/10/2026;;MENSE;;40,00;ROSSI MARIO;2026;1;;;01/10/2026;100;;Mensa Scolastica;ROSSI;MARIO;AAA",
        "16/10/2026;01/09/2026;MENSE;;80,00;BIANCHI LUCIA;2026;1;;;01/09/2026;200;;Mensa Scolastica;BIANCHI;LUCIA;BBB",
        "10/10/2027;;MENSE;;40,00;NERI LUCA;2027;1;;;10/10/2027;500;;Mensa Scolastica;NERI;LUCA;EEE",
        "15/06/2026;;MENSE;;40,00;VERDI ANNA;2026;1;;;01/06/2026;400;;Mensa Scolastica;VERDI;ANNA;DDD",
        "16/10/2026;;MENSE;;0,01;TEST;2026;1;;;01/10/2026;300;;Test 1;TEST;UTENTE;CCC",
      ]),
    )
    assert.equal(primo.nuovi, 3)
    assert.equal(primo.esclusiTest, 1)
    assert.equal(primo.fuoriPeriodo, 1)
    assert.equal((await leggiTutti(client)).length, 3)
    assert.equal((await leggiPerIuv(client, "100"))?.annoScolastico, "2026/2027")
    assert.equal((await leggiPerIuv(client, "500"))?.annoScolastico, "2027/2028")
    assert.equal(await leggiPerIuv(client, "400"), null)

    const promosso = await eseguiImport(
      client,
      csv([
        "20/10/2026;02/10/2026 09:00:00;MENSE;;40,00;ROSSI MARIO;2026;9;;;02/10/2026;100;PSP-A;Mensa Scolastica;ROSSI;MARIO;AAA",
      ]),
    )
    assert.equal(promosso.aggiornati, 1)
    const rossi = await leggiPerIuv(client, "100")
    assert.equal(rossi?.dataPagamento, "2026-10-02T09:00:00")
    assert.equal(rossi?.blocchettiConsegnati, 0)
    assert.ok(await leggiPerIuv(client, "200"))

    const bianchi = await leggiPerIuv(client, "200")
    assert.ok(bianchi)
    const passo = applicaConsegna(bianchi, "parziale")
    assert.equal(passo.ok, true)
    if (passo.ok) await salvaConsegna(client, "200", passo.record.blocchettiConsegnati)

    const dopo = await eseguiImport(
      client,
      csv([
        "16/10/2026;01/09/2026;MENSE;;80,00;NOME CAMBIATO;2026;1;;99;01/09/2026;200;PSP-B;Mensa Scolastica;BIANCHI;LUCIA;BBB",
      ]),
    )
    assert.equal(dopo.aggiornati, 1)
    const ancora = await leggiPerIuv(client, "200")
    assert.equal(ancora?.blocchettiConsegnati, 1)
    assert.equal(ancora?.dataPagamento, "2026-09-01")
    assert.equal(ancora?.debitore, "BIANCHI LUCIA")
    assert.equal(ancora?.pspRiferimento, "PSP-B")
    assert.ok(await leggiPerIuv(client, "100"))

    const chiuso = applicaConsegna(ancora!, "completa")
    if (chiuso.ok) await salvaConsegna(client, "200", chiuso.record.blocchettiConsegnati)
    const ignorato = await eseguiImport(
      client,
      csv([
        "16/10/2026;01/09/2026;MENSE;;80,00;ALTRO;2026;1;;;01/09/2026;200;PSP-C;Mensa Scolastica;BIANCHI;LUCIA;BBB",
      ]),
    )
    assert.equal(ignorato.ignorati, 1)
    assert.equal((await leggiPerIuv(client, "200"))?.pspRiferimento, "PSP-B")
  } finally {
    client.close()
  }
})
