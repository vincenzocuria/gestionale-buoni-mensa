import assert from "node:assert/strict"
import test from "node:test"
import { annoPredefinito, anniSelezionabili, eAnnoImportato, etichettaImportabile } from "./calcola"

test("settembre 2026 apre il 2026/2027 e agosto resta fuori", () => {
  assert.equal(
    etichettaImportabile({ dataScadenza: "2026-09-01", dataEmissione: null, dataPagamento: null }),
    "2026/2027",
  )
  assert.equal(
    etichettaImportabile({ dataScadenza: "2026-08-31", dataEmissione: null, dataPagamento: null }),
    null,
  )
  assert.equal(
    etichettaImportabile({ dataScadenza: "2027-09-01", dataEmissione: null, dataPagamento: null }),
    "2027/2028",
  )
})

test("senza scadenza usa emissione e poi pagamento", () => {
  assert.equal(
    etichettaImportabile({ dataScadenza: null, dataEmissione: "2027-01-10", dataPagamento: "2026-08-01" }),
    "2026/2027",
  )
  assert.equal(
    etichettaImportabile({ dataScadenza: null, dataEmissione: null, dataPagamento: "2026-06-01" }),
    null,
  )
})

test("il selettore parte dall'anno in corso e ignora le etichette vecchie", () => {
  const oggi = new Date(2026, 9, 1)
  const anni = anniSelezionabili(["2025/2026", "2027/2028", ""], oggi)
  assert.deepEqual(anni, ["2026/2027", "2027/2028"])
  assert.equal(annoPredefinito(anni, oggi), "2026/2027")
  assert.equal(eAnnoImportato("2025/2026"), false)
})
