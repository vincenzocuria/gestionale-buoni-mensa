import assert from "node:assert/strict"
import test from "node:test"
import { applicaOrario, normalizzaQuando } from "./modifica"
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
    blocchettiConsegnati: 2,
    consegneIl: ["2026-10-01T11:30:00", "2026-10-02T16:05:00"],
    ...parziale,
  }
}

test("normalizza data e ora e rifiuta un giorno inesistente", () => {
  assert.equal(normalizzaQuando("2026-10-05T08:47"), "2026-10-05T08:47:00")
  assert.equal(normalizzaQuando("2026-02-31T10:00:00"), null)
  assert.equal(normalizzaQuando("05/10/2026"), null)
})

test("modifica un orario e lascia il conteggio", () => {
  const esito = applicaOrario(base(), "modifica", 1, "2026-10-03T09:15")
  assert.equal(esito.ok, true)
  if (!esito.ok) return
  assert.deepEqual(esito.record.consegneIl, ["2026-10-01T11:30:00", "2026-10-03T09:15:00"])
  assert.equal(esito.record.blocchettiConsegnati, 2)
  assert.equal(esito.record.dataPagamento, "2026-10-01")
})

test("rimuovi toglie un solo orario", () => {
  const esito = applicaOrario(base(), "rimuovi", 0, null)
  assert.equal(esito.ok, true)
  if (!esito.ok) return
  assert.deepEqual(esito.record.consegneIl, ["2026-10-02T16:05:00"])
  assert.equal(esito.record.blocchettiConsegnati, 1)
})

test("registra aggiunge un orario scelto finché c'è posto", () => {
  const aperto = base({ blocchettiConsegnati: 1, consegneIl: ["2026-10-01T11:30:00"] })
  const esito = applicaOrario(aperto, "registra", null, "2026-10-04T12:00:00")
  assert.equal(esito.ok, true)
  if (!esito.ok) return
  assert.equal(esito.record.blocchettiConsegnati, 2)
  assert.equal(esito.record.consegneIl[1], "2026-10-04T12:00:00")
  const pieno = applicaOrario(esito.record, "registra", null, "2026-10-05T12:00:00")
  assert.equal(pieno.ok, false)
})
