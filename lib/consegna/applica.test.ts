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
    consegneIl: [],
    ...parziale,
  }
}

const ORA = "2026-10-01T11:30:00"

test("Consegnato chiude i residui e Annulla non tocca il pagamento", () => {
  const chiuso = applicaConsegna(base(), "completa", ORA)
  assert.equal(chiuso.ok && chiuso.record.blocchettiConsegnati, 2)
  assert.deepEqual(chiuso.ok && chiuso.record.consegneIl, [ORA, ORA])
  assert.equal(chiuso.ok && chiuso.record.dataPagamento, "2026-10-01")
  const annullo = applicaConsegna(chiuso.ok ? chiuso.record : base(), "annulla", "2026-10-02T08:00:00")
  assert.equal(annullo.ok && annullo.record.blocchettiConsegnati, 0)
  assert.deepEqual(annullo.ok && annullo.record.consegneIl, [])
  assert.equal(annullo.ok && annullo.record.dataPagamento, "2026-10-01")
})

test("+1 solo sui pagamenti da due blocchetti", () => {
  const passo = applicaConsegna(base(), "parziale", ORA)
  assert.equal(passo.ok && passo.record.blocchettiConsegnati, 1)
  assert.deepEqual(passo.ok && passo.record.consegneIl, [ORA])
  const secondo = applicaConsegna(passo.ok ? passo.record : base(), "parziale", "2026-10-02T16:05:00")
  assert.deepEqual(secondo.ok && secondo.record.consegneIl, [ORA, "2026-10-02T16:05:00"])
  const singolo = applicaConsegna(base({ importoCentesimi: 4000, blocchettiDovuti: 1 }), "parziale", ORA)
  assert.equal(singolo.ok, false)
})

test("non consegna un bollettino non pagato", () => {
  const esito = applicaConsegna(base({ dataPagamento: null }), "completa", ORA)
  assert.equal(esito.ok, false)
})
