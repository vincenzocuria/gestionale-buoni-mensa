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

test("tiene solo il servizio mensa e mette da parte la mensa pagata su altri servizi", () => {
  const csv = `${INTESTAZIONE}
16/10/2026;01/10/2026 08:12:00;MENSE SCOLASTICHE;;40,00;ROSSI MARIO;2026;83;;;01/10/2026;'1;;Mensa Scolastica;ROSSI;MARIO;AAA
29/05/2027;22/11/2026 13:59:00;ACQUEDOTTO;;78,01;ACETO VITTORIA;2025;362;;;08/07/2026;'2;;Acquedotto 2025 - Avviso N. 59;ACETO;VITTORIA;BBB
16/12/2026;21/11/2026 11:30:00;TRASPORTO SCOLASTICO;;35,00;ALAGIA LUANA;2026;76;;;04/11/2026;'3;;Trasporto Scolastico Novembre 2026;ALAGIA;LUANA;CCC
09/11/2026;10/10/2026 16:34:00;DIRITTI VARI;;40,00;Curci Erminia;2026;83;;;10/10/2026;'4;;Mensa scolastica Arone Francesco;Curci;Erminia;DDD
05/06/2026;06/05/2026 12:57:00;DIRITTI VARI;;40,00;Curci Erminia;2025;348;;;06/05/2026;'5;;Buoni mensa ARONE FRANCESCO;Curci;Erminia;DDD
01/12/2026;;EMISSIONE CARTA D'IDENTITÀ ELETTRONICA;;22,21;BIANCHI LUCA;2026;10;;;01/11/2026;;;Carta d'identità;BIANCHI;LUCA;EEE`
  const lettura = parseStampaRicerca(csv)
  assert.deepEqual(
    lettura.righe.map((riga) => riga.iuv),
    ["1"],
  )
  assert.deepEqual(
    lettura.mensaSuAltroServizio.map(({ numero, riga }) => [numero, riga.iuv, riga.servizio]),
    [
      [5, "4", "DIRITTI VARI"],
      [6, "5", "DIRITTI VARI"],
    ],
  )
  assert.equal(lettura.altriServizi, 3)
  assert.equal(lettura.righeLette, 6)
  assert.deepEqual(lettura.errori, [])
})

test("export senza la colonna Servizio: decide la causale", () => {
  const csv = `Data scadenza;Data Pagamento;Importo;Debitore;Accertamento anno;Accertamento numero;Reversale data;Reversale numero;IUV;PspRiferimento;Causale Pagamento;Cognome;Nome;Cod Fiscale
16/10/2026;01/10/2026;40,00;ROSSI MARIO;2026;83;;;'1;;Mensa Scolastica;ROSSI;MARIO;AAA
16/10/2026;01/10/2026;78,00;ROSSI MARIO;2026;83;;;'2;;Acquedotto 2025;ROSSI;MARIO;AAA`
  const lettura = parseStampaRicerca(csv)
  assert.deepEqual(lettura.righe.map((riga) => riga.iuv), ["1"])
  assert.equal(lettura.altriServizi, 1)
  assert.equal(lettura.mensaSuAltroServizio.length, 0)
})
