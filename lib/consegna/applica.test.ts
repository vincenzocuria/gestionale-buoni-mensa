import assert from "node:assert/strict"
import test from "node:test"
import { applicaConsegna } from "./applica"
import type { Pagamento } from "../pagamenti/tipi"

function base(parziale: Partial<Pagamento> = {}): Pagamento {
  return {
    iuv: "1",
    dataScadenza: "2026-10-16",
    dataPagamento: "2026-10-01",
    servizio: "MENSE",
    tipologia: "",
    importoCentesimi: 8000,
    debitore: "ROSSI",
    accertamentoAnno: "2026",
    accertamentoNumero: "1",
    reversaleData: null,
    reversaleNumero: "",
    dataEmissione: null,
    pspRiferimento: "",
    causale: "Mensa",
    cognome: "ROSSI",
    nome: "MARIO",
    codiceFiscale: "X",
    annoScolastico: "2026/2027",
    tariffaRidotta: false,
    blocchettiDovuti: 2,
    blocchettiConsegnati: 0,
    ...parziale,
  }
}

test("Consegnato chiude i residui e Annulla non tocca il pagamento", () => {
  const chiuso = applicaConsegna(base(), "completa")
  assert.equal(chiuso.ok && chiuso.record.blocchettiConsegnati, 2)
  assert.equal(chiuso.ok && chiuso.record.dataPagamento, "2026-10-01")
  const annullo = applicaConsegna(chiuso.ok ? chiuso.record : base(), "annulla")
  assert.equal(annullo.ok && annullo.record.blocchettiConsegnati, 0)
  assert.equal(annullo.ok && annullo.record.dataPagamento, "2026-10-01")
})

test("+1 solo sui pagamenti da due blocchetti", () => {
  const passo = applicaConsegna(base(), "parziale")
  assert.equal(passo.ok && passo.record.blocchettiConsegnati, 1)
  const singolo = applicaConsegna(base({ importoCentesimi: 4000, blocchettiDovuti: 1 }), "parziale")
  assert.equal(singolo.ok, false)
})

test("non consegna un bollettino non pagato", () => {
  const esito = applicaConsegna(base({ dataPagamento: null }), "completa")
  assert.equal(esito.ok, false)
})
