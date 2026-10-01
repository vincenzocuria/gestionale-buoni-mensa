import assert from "node:assert/strict"
import test from "node:test"
import { analizzaBlocchetti } from "@/lib/audit/gruppi"
import type { RigaAudit } from "@/lib/audit/tipi"
import { chiavePersonaAnno, schedaPersona } from "@/lib/pagamenti/persona"
import type { RigaElenco } from "@/lib/pagamenti/tipi"

function audit(parziale: Partial<RigaAudit> & Pick<RigaAudit, "iuv" | "importoCentesimi">): RigaAudit {
  return {
    dataPagamento: "2026-10-01",
    codiceFiscale: "RSSMRA80A01H501U",
    debitore: "ROSSI MARIO",
    cognome: "ROSSI",
    nome: "MARIO",
    annoScolastico: "2026/2027",
    blocchettiConsegnati: 0,
    ...parziale,
  }
}

function elenco(base: RigaAudit, extra: Partial<RigaElenco> = {}): RigaElenco {
  const multiplo = base.importoCentesimi > 0 && base.importoCentesimi % 4000 === 0
  return {
    iuv: base.iuv,
    debitore: base.debitore,
    cognome: base.cognome,
    nome: base.nome,
    codiceFiscale: base.codiceFiscale,
    importoCentesimi: base.importoCentesimi,
    tariffaRidotta: false,
    blocchettiDovuti: multiplo ? base.importoCentesimi / 4000 : 0,
    blocchettiConsegnati: base.blocchettiConsegnati,
    consegneIl: [],
    dataPagamento: base.dataPagamento,
    dataScadenza: "2026-10-15",
    annoScolastico: base.annoScolastico,
    stato: base.dataPagamento
      ? base.blocchettiConsegnati > 0 && multiplo && base.blocchettiConsegnati >= base.importoCentesimi / 4000
        ? "consegnato"
        : "da_consegnare"
      : "non_pagato",
    ...extra,
  }
}

test("due figli dello stesso genitore restano due blocchetti nella stessa scheda", () => {
  const primo = audit({ iuv: "1", importoCentesimi: 4000, dataPagamento: "2026-09-10", blocchettiConsegnati: 1 })
  const secondo = audit({ iuv: "2", importoCentesimi: 4000, dataPagamento: "2026-10-20" })
  const altro = audit({
    iuv: "3",
    importoCentesimi: 4000,
    codiceFiscale: "BNCLGU80A01H501U",
    debitore: "BIANCHI LUIGI",
  })
  const righe = [elenco(primo), elenco(secondo), elenco(altro)]
  const scheda = schedaPersona(righe, analizzaBlocchetti([primo, secondo, altro]), chiavePersonaAnno(elenco(primo)))
  assert.equal(scheda?.voci.length, 2)
  assert.equal(scheda?.dovuti, 2)
  assert.equal(scheda?.consegnati, 1)
  assert.equal(scheda?.daConsegnare, 1)
  assert.equal(scheda?.voci[0]?.tipo === "singola" && scheda.voci[0].riga.iuv, "2")
})

test("un IUV nuovo dell'anno dopo non entra nella scheda dell'anno in corso", () => {
  const attuale = audit({ iuv: "1", importoCentesimi: 4000 })
  const prossimo = audit({ iuv: "9", importoCentesimi: 4000, annoScolastico: "2027/2028", dataPagamento: "2027-09-15" })
  const righe = [elenco(attuale), elenco(prossimo)]
  const scheda = schedaPersona(righe, analizzaBlocchetti([attuale, prossimo]), chiavePersonaAnno(elenco(attuale)))
  assert.equal(scheda?.annoScolastico, "2026/2027")
  assert.equal(scheda?.voci.length, 1)
  assert.equal(scheda?.voci[0]?.tipo === "singola" && scheda.voci[0].riga.iuv, "1")
})

test("i versamenti parziali dello stesso genitore compaiono come un solo acquisto", () => {
  const a = audit({ iuv: "10", importoCentesimi: 2000, dataPagamento: "2026-09-03" })
  const b = audit({ iuv: "11", importoCentesimi: 2000, dataPagamento: "2026-09-30" })
  const righe = [elenco(a), elenco(b)]
  const scheda = schedaPersona(righe, analizzaBlocchetti([a, b]), chiavePersonaAnno(elenco(a)))
  assert.equal(scheda?.voci.length, 1)
  assert.equal(scheda?.voci[0]?.tipo, "gruppo")
  assert.equal(scheda?.dovuti, 1)
  assert.equal(scheda?.daConsegnare, 1)
})
