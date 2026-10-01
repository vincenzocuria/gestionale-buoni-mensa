import assert from "node:assert/strict"
import test from "node:test"
import { filtraPeriodo, intervalloPreset, presetAttivo } from "./periodo"
import type { VoceElenco } from "./voci"
import type { RigaElenco } from "./tipi"

function voce(iuv: string, pagamento: string | null, scadenza = "2026-10-15"): VoceElenco {
  const riga: RigaElenco = {
    iuv,
    debitore: "ROSSI",
    cognome: "ROSSI",
    nome: "MARIO",
    codiceFiscale: "AAA",
    importoCentesimi: 4000,
    tariffaRidotta: false,
    blocchettiDovuti: 1,
    blocchettiConsegnati: 0,
    consegneIl: [],
    dataPagamento: pagamento,
    dataScadenza: scadenza,
    annoScolastico: "2026/2027",
    stato: pagamento ? "da_consegnare" : "non_pagato",
  }
  return { tipo: "singola", id: iuv, riga }
}

test("il 1 ottobre 2026 cade nella settimana dal lunedì e nel mese intero", () => {
  assert.deepEqual(intervalloPreset("oggi", "2026-10-01"), { dal: "2026-10-01", al: "2026-10-01" })
  assert.deepEqual(intervalloPreset("settimana", "2026-10-01"), { dal: "2026-09-28", al: "2026-10-04" })
  assert.deepEqual(intervalloPreset("mese", "2026-10-01"), { dal: "2026-10-01", al: "2026-10-31" })
})

test("il periodo è inclusivo e un accorpamento resta intero se un versamento cade dentro", () => {
  const settembre = voce("1", "2026-09-03T09:00:00")
  const ottobre = voce("2", "2026-10-02")
  const meta = voce("10", "2026-09-03")
  const altra = voce("11", "2026-10-02")
  if (meta.tipo !== "singola" || altra.tipo !== "singola") return
  const gruppo: VoceElenco = {
    tipo: "gruppo",
    id: "g",
    gruppo: {
      id: "g",
      annoScolastico: "2026/2027",
      debitore: "CIPOLLA SARA",
      esito: "accorpato",
      pagamenti: [],
      sommaCentesimi: 4000,
      blocchetti: 1,
      consegnati: 0,
      testo: "",
    },
    righe: [meta.riga, altra.riga],
  }
  const trovate = filtraPeriodo([settembre, ottobre, gruppo], {
    campo: "pagamento",
    dal: "2026-09-01",
    al: "2026-09-30",
  })
  assert.deepEqual(
    trovate.map((voceElenco) => voceElenco.id),
    ["1", "g"],
  )
  assert.equal(presetAttivo({ campo: "pagamento", dal: "2026-10-01", al: "2026-10-31" }, "2026-10-01"), "mese")
  assert.equal(
    filtraPeriodo([settembre, ottobre, gruppo], { campo: "scadenza", dal: "2026-10-15", al: "2026-10-15" }).length,
    3,
  )
})
