import assert from "node:assert/strict"
import test from "node:test"
import { calcolaKpi } from "./kpi"
import { filtraPagamenti } from "./filtra"
import type { RigaElenco } from "./tipi"

const righe: RigaElenco[] = [
  {
    iuv: "1",
    debitore: "ROSSI MARIO",
    cognome: "ROSSI",
    nome: "MARIO",
    codiceFiscale: "AAA",
    importoCentesimi: 4000,
    tariffaRidotta: false,
    blocchettiDovuti: 1,
    blocchettiConsegnati: 0,
    consegneIl: [],
    dataPagamento: "2026-10-01",
    dataScadenza: "2026-10-16",
    annoScolastico: "2026/2027",
    stato: "da_consegnare",
  },
  {
    iuv: "2",
    debitore: "BIANCHI LUCIA",
    cognome: "BIANCHI",
    nome: "LUCIA",
    codiceFiscale: "BBB",
    importoCentesimi: 8000,
    tariffaRidotta: false,
    blocchettiDovuti: 2,
    blocchettiConsegnati: 2,
    consegneIl: [],
    dataPagamento: "2026-09-01",
    dataScadenza: "2026-09-15",
    annoScolastico: "2026/2027",
    stato: "consegnato",
  },
  {
    iuv: "3",
    debitore: "ROSSI MARIO",
    cognome: "ROSSI",
    nome: "MARIO",
    codiceFiscale: "AAA",
    importoCentesimi: 2000,
    tariffaRidotta: true,
    blocchettiDovuti: 1,
    blocchettiConsegnati: 0,
    consegneIl: [],
    dataPagamento: null,
    dataScadenza: "2026-11-01",
    annoScolastico: "2026/2027",
    stato: "non_pagato",
  },
]

test("i KPI contano i codici fiscali e i blocchetti", () => {
  const kpi = calcolaKpi(righe)
  assert.equal(kpi.paganti, 2)
  assert.equal(kpi.nonPaganti, 1)
  assert.equal(kpi.blocchettiDaConsegnare, 1)
  assert.equal(kpi.blocchettiConsegnati, 2)
  assert.equal(kpi.incassatoCentesimi, 12000)
  assert.equal(kpi.daIncassareCentesimi, 2000)
})

test("filtri e ricerca", () => {
  assert.equal(filtraPagamenti(righe, "tutti", "").length, 3)
  assert.equal(filtraPagamenti(righe, "paganti", "").length, 2)
  assert.equal(filtraPagamenti(righe, "non_paganti", "").length, 1)
  assert.equal(filtraPagamenti(righe, "da_consegnare", "").length, 1)
  assert.equal(filtraPagamenti(righe, "consegnati", "").length, 1)
  assert.equal(filtraPagamenti(righe, "tutti", "lucia").length, 1)
  assert.equal(filtraPagamenti(righe, "tutti", "'1").length, 1)
})
