import assert from "node:assert/strict"
import test from "node:test"
import { conteggiBlocchetti } from "./conteggi"
import { analizzaBlocchetti, pianoConsegnaGruppo } from "./gruppi"
import type { RigaAudit } from "./tipi"

function riga(parziale: Partial<RigaAudit> & Pick<RigaAudit, "iuv" | "importoCentesimi">): RigaAudit {
  return {
    dataPagamento: "2026-10-01",
    codiceFiscale: "AAA",
    debitore: "ROSSI MARIO",
    cognome: "ROSSI",
    nome: "MARIO",
    annoScolastico: "2026/2027",
    blocchettiConsegnati: 0,
    ...parziale,
  }
}

test("20, 30 e 50 euro sono anomalie, 40 e 80 no", () => {
  const analisi = analizzaBlocchetti([
    riga({ iuv: "1", importoCentesimi: 4000 }),
    riga({ iuv: "2", importoCentesimi: 8000, codiceFiscale: "BBB", debitore: "BIANCHI" }),
    riga({ iuv: "3", importoCentesimi: 2000, codiceFiscale: "CCC", debitore: "VERDI" }),
    riga({ iuv: "4", importoCentesimi: 3000, codiceFiscale: "DDD", debitore: "NERI" }),
    riga({ iuv: "5", importoCentesimi: 5000, codiceFiscale: "EEE", debitore: "GIALLI" }),
  ])
  assert.equal(analisi.perIuv.get("1")?.esito, "valido")
  assert.equal(analisi.perIuv.get("2")?.esito, "valido")
  assert.equal(analisi.perIuv.get("3")?.esito, "anomalia")
  assert.equal(analisi.perIuv.get("4")?.esito, "anomalia")
  assert.equal(analisi.perIuv.get("5")?.esito, "anomalia")
})

test("due pagamenti da 20 euro nello stesso anno si accorpano e restano visibili", () => {
  const analisi = analizzaBlocchetti([
    riga({ iuv: "10", importoCentesimi: 2000 }),
    riga({ iuv: "11", importoCentesimi: 2000 }),
  ])
  const gruppo = analisi.gruppi[0]
  assert.equal(gruppo.esito, "accorpato")
  assert.equal(gruppo.blocchetti, 1)
  assert.deepEqual(gruppo.pagamenti.map((voce) => voce.iuv).sort(), ["10", "11"])
  assert.equal(analisi.perIuv.get("10")?.esito, "accorpato")
  assert.match(gruppo.testo, /IUV 10/)
  assert.match(gruppo.testo, /IUV 11/)
})

test("due da 20 euro in anni diversi restano anomalie", () => {
  const analisi = analizzaBlocchetti([
    riga({ iuv: "10", importoCentesimi: 2000, annoScolastico: "2026/2027" }),
    riga({ iuv: "11", importoCentesimi: 2000, annoScolastico: "2027/2028" }),
  ])
  assert.equal(analisi.gruppi.length, 2)
  assert.equal(analisi.gruppi.every((gruppo) => gruppo.esito === "anomalia"), true)
})

test("tre da 20 euro ne accorpano due e lasciano il resto in anomalia", () => {
  const analisi = analizzaBlocchetti([
    riga({ iuv: "1", importoCentesimi: 2000 }),
    riga({ iuv: "2", importoCentesimi: 2000 }),
    riga({ iuv: "3", importoCentesimi: 2000 }),
  ])
  const accorpato = analisi.gruppi.find((gruppo) => gruppo.esito === "accorpato")
  const anomalia = analisi.gruppi.find((gruppo) => gruppo.esito === "anomalia")
  assert.equal(accorpato?.pagamenti.length, 2)
  assert.equal(anomalia?.pagamenti.length, 1)
  const libri = conteggiBlocchetti([
    riga({ iuv: "1", importoCentesimi: 2000 }),
    riga({ iuv: "2", importoCentesimi: 2000 }),
    riga({ iuv: "3", importoCentesimi: 2000 }),
  ])
  assert.equal(libri.blocchettiDaConsegnare, 1)
  assert.equal(libri.blocchettiConsegnati, 0)
})

test("la consegna del gruppo segna i blocchetti una sola volta", () => {
  const analisi = analizzaBlocchetti([
    riga({ iuv: "10", importoCentesimi: 2000 }),
    riga({ iuv: "11", importoCentesimi: 2000 }),
  ])
  const piano = pianoConsegnaGruppo(analisi.gruppi[0], "completa", "2026-10-01T11:30:00")
  assert.deepEqual(piano, [
    { iuv: "10", consegnati: 1, consegneIl: ["2026-10-01T11:30:00"] },
    { iuv: "11", consegnati: 0, consegneIl: [] },
  ])
})
