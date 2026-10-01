import assert from "node:assert/strict"
import test from "node:test"
import { analizzaBlocchetti } from "../audit/gruppi"
import type { RigaAudit } from "../audit/tipi"
import { compattaElenco, filtraVoci } from "./voci"
import type { RigaElenco } from "./tipi"

function audit(parziale: Partial<RigaAudit> & Pick<RigaAudit, "iuv" | "importoCentesimi">): RigaAudit {
  return {
    dataPagamento: "2026-09-30",
    codiceFiscale: "AAA",
    debitore: "CIPOLLA SARA",
    cognome: "CIPOLLA",
    nome: "SARA",
    annoScolastico: "2026/2027",
    blocchettiConsegnati: 0,
    ...parziale,
  }
}

function elenco(base: RigaAudit, extra: Partial<RigaElenco> = {}): RigaElenco {
  return {
    iuv: base.iuv,
    debitore: base.debitore,
    cognome: base.cognome,
    nome: base.nome,
    codiceFiscale: base.codiceFiscale,
    importoCentesimi: base.importoCentesimi,
    tariffaRidotta: false,
    blocchettiDovuti: base.importoCentesimi === 4000 ? 1 : 0,
    blocchettiConsegnati: base.blocchettiConsegnati,
    dataPagamento: base.dataPagamento,
    dataScadenza: "2026-10-15",
    annoScolastico: base.annoScolastico,
    stato: base.dataPagamento ? "da_consegnare" : "non_pagato",
    ...extra,
  }
}

test("due pagamenti da 20 euro diventano una sola riga di anomalia", () => {
  const sorgenti = [
    audit({ iuv: "10", importoCentesimi: 2000, dataPagamento: "2026-09-03" }),
    audit({ iuv: "40", importoCentesimi: 4000, codiceFiscale: "BBB", debitore: "ROSSI MARIO", cognome: "ROSSI", nome: "MARIO" }),
    audit({ iuv: "11", importoCentesimi: 2000, dataPagamento: "2026-09-30" }),
  ]
  const righe = sorgenti.map((riga) => elenco(riga))
  const voci = compattaElenco(righe, analizzaBlocchetti(sorgenti))
  assert.equal(voci.length, 2)
  assert.equal(voci[0]?.tipo, "gruppo")
  assert.equal(voci[1]?.tipo, "singola")
  if (voci[0]?.tipo !== "gruppo") return
  assert.deepEqual(
    voci[0].righe.map((riga) => riga.iuv),
    ["10", "11"],
  )
  assert.equal(filtraVoci(voci, "tutti", "11").length, 1)
  assert.equal(filtraVoci(voci, "da_consegnare", "").length, 2)
})

test("il gruppo consegnato non resta tra i da consegnare", () => {
  const sorgenti = [
    audit({ iuv: "10", importoCentesimi: 2000, blocchettiConsegnati: 1 }),
    audit({ iuv: "11", importoCentesimi: 2000 }),
  ]
  const righe = sorgenti.map((riga) => elenco(riga))
  const voci = compattaElenco(righe, analizzaBlocchetti(sorgenti))
  assert.equal(filtraVoci(voci, "consegnati", "").length, 1)
  assert.equal(filtraVoci(voci, "da_consegnare", "").length, 0)
})
