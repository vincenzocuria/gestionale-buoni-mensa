import assert from "node:assert/strict"
import test from "node:test"
import { applicaMerge } from "./merge-incrementale"
import type { Pagamento, RigaSiscom } from "../pagamenti/tipi"

function riga(parziale: Partial<RigaSiscom> = {}): RigaSiscom {
  return {
    iuv: "28019000000000001",
    dataScadenza: "2026-10-16",
    dataPagamento: null,
    servizio: "MENSE",
    tipologia: "",
    importoCentesimi: 4000,
    debitore: "ROSSI MARIO",
    accertamentoAnno: "2026",
    accertamentoNumero: "83",
    reversaleData: null,
    reversaleNumero: "",
    dataEmissione: "2026-10-01",
    pspRiferimento: "",
    causale: "Mensa Scolastica",
    cognome: "ROSSI",
    nome: "MARIO",
    codiceFiscale: "RSSMRA80A01H501U",
    ...parziale,
  }
}

function pagamento(parziale: Partial<Pagamento> = {}): Pagamento {
  return {
    ...riga(),
    annoScolastico: "2026/2027",
    tariffaRidotta: false,
    blocchettiDovuti: 1,
    blocchettiConsegnati: 0,
    ...parziale,
  }
}

test("inserisce un IUV nuovo e non lo segna consegnato", () => {
  const esito = applicaMerge(null, riga({ dataPagamento: "2026-10-01" }))
  assert.equal(esito.esito, "nuovo")
  assert.equal(esito.record?.blocchettiConsegnati, 0)
  assert.equal(esito.record?.blocchettiDovuti, 1)
})

test("esclude importo 0,01 e causale Test", () => {
  assert.equal(applicaMerge(null, riga({ importoCentesimi: 1 })).esito, "escluso_test")
  assert.equal(applicaMerge(null, riga({ causale: "Test collaudo" })).esito, "escluso_test")
})

test("aggiorna il non pagato e lo promuove se compare la data", () => {
  const aperto = pagamento({ debitore: "VECCHIO" })
  const esito = applicaMerge(
    aperto,
    riga({ debitore: "ROSSI MARIO", dataPagamento: "2026-10-01T08:12:00", importoCentesimi: 8000 }),
  )
  assert.equal(esito.esito, "aggiornato")
  assert.equal(esito.record?.debitore, "ROSSI MARIO")
  assert.equal(esito.record?.dataPagamento, "2026-10-01T08:12:00")
  assert.equal(esito.record?.blocchettiDovuti, 2)
  assert.equal(esito.record?.blocchettiConsegnati, 0)
})

test("sul pagato incompleto compila solo i campi vuoti", () => {
  const esistente = pagamento({
    dataPagamento: "2026-09-01",
    pspRiferimento: "",
    reversaleNumero: "",
    dataScadenza: null,
    blocchettiConsegnati: 0,
    debitore: "ROSSI MARIO",
  })
  const esito = applicaMerge(
    esistente,
    riga({
      dataPagamento: null,
      debitore: "ALTRO NOME",
      pspRiferimento: "PSP-1",
      reversaleNumero: "1756",
      dataScadenza: "2026-10-16",
      importoCentesimi: 8000,
    }),
  )
  assert.equal(esito.esito, "aggiornato")
  assert.equal(esito.record?.dataPagamento, "2026-09-01")
  assert.equal(esito.record?.debitore, "ROSSI MARIO")
  assert.equal(esito.record?.importoCentesimi, 4000)
  assert.equal(esito.record?.pspRiferimento, "PSP-1")
  assert.equal(esito.record?.reversaleNumero, "1756")
  assert.equal(esito.record?.dataScadenza, "2026-10-16")
  assert.equal(esito.record?.blocchettiConsegnati, 0)
})

test("non sovrascrive un campo Siscom già presente", () => {
  const esistente = pagamento({
    dataPagamento: "2026-09-01",
    pspRiferimento: "GIA",
    blocchettiConsegnati: 0,
  })
  const esito = applicaMerge(esistente, riga({ dataPagamento: "2026-10-02", pspRiferimento: "NUOVO" }))
  assert.equal(esito.esito, "invariato")
  assert.equal(esito.record, null)
})

test("ignora il bollettino già completo", () => {
  const esistente = pagamento({ dataPagamento: "2026-09-01", blocchettiConsegnati: 1, blocchettiDovuti: 1 })
  const esito = applicaMerge(esistente, riga({ debitore: "CAMBIO", pspRiferimento: "X" }))
  assert.equal(esito.esito, "ignorato")
})

test("non azzera la consegna parziale", () => {
  const esistente = pagamento({
    dataPagamento: "2026-09-01",
    importoCentesimi: 8000,
    blocchettiDovuti: 2,
    blocchettiConsegnati: 1,
    pspRiferimento: "",
  })
  const esito = applicaMerge(esistente, riga({ importoCentesimi: 8000, pspRiferimento: "PSP-2" }))
  assert.equal(esito.record?.blocchettiConsegnati, 1)
  assert.equal(esito.record?.pspRiferimento, "PSP-2")
})
