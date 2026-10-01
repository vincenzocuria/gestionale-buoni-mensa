import assert from "node:assert/strict"
import test from "node:test"
import { parseStampaRicerca } from "./parse-stampa-ricerca"
import { ErroreCsv } from "./errore-csv"

const INTESTAZIONE =
  "Data scadenza;Data Pagamento;Servizio;Tipologia;Importo; Debitore;Accertamento anno;Accertamento numero;Reversale data;Reversale numero;Data emissione;IUV;PspRiferimento;Causale Pagamento;Cognome;Nome;Cod Fiscale"

test("toglie l'apice dall'IUV e legge importo e data con ora", () => {
  const csv = `${INTESTAZIONE}
16/10/2026;01/10/2026 08:12:00;MENSE;;40,00;ROSSI MARIO;2026;83;;;01/10/2026;'28019000000000001;;Mensa Scolastica;ROSSI;MARIO;RSSMRA80A01H501U`
  const lettura = parseStampaRicerca(csv)
  assert.equal(lettura.righe.length, 1)
  assert.equal(lettura.righe[0].iuv, "28019000000000001")
  assert.equal(lettura.righe[0].importoCentesimi, 4000)
  assert.equal(lettura.righe[0].dataPagamento, "2026-10-01T08:12:00")
  assert.equal(lettura.righe[0].debitore, "ROSSI MARIO")
})

test("rifiuta un CSV senza le colonne Siscom", () => {
  assert.throws(() => parseStampaRicerca("Nome;Cognome\nA;B"), ErroreCsv)
})
