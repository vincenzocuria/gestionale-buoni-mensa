import assert from "node:assert/strict"
import test from "node:test"
import { inflateSync } from "node:zlib"
import { creaPdfRegistro, larghezzaTesto } from "./pdf-registro"
import { righeRegistro, totaliRegistro } from "./registro-consegne"
import type { RigaElenco } from "@/lib/pagamenti/tipi"

function riga(parziale: Partial<RigaElenco> & Pick<RigaElenco, "iuv" | "importoCentesimi">): RigaElenco {
  const dovuti = parziale.importoCentesimi % 4000 === 0 ? parziale.importoCentesimi / 4000 : 0
  return {
    debitore: "ROSSI MARIO",
    cognome: "ROSSI",
    nome: "MARIO",
    codiceFiscale: "RSSMRA80A01H501U",
    tariffaRidotta: false,
    blocchettiDovuti: dovuti,
    blocchettiConsegnati: 0,
    consegneIl: [],
    dataPagamento: "2026-11-10T12:00:00",
    dataScadenza: "2026-11-25",
    annoScolastico: "2026/2027",
    stato: "da_consegnare",
    ...parziale,
  }
}

const persona = (debitore: string, cf: string) => {
  const [cognome, nome] = debitore.split(" ")
  return { debitore, cognome, nome, codiceFiscale: cf }
}

const anno: RigaElenco[] = [
  riga({ iuv: "1", importoCentesimi: 4000, ...persona("VERDI ANNA", "VRDNNA") }),
  riga({ iuv: "2", importoCentesimi: 8000, blocchettiConsegnati: 1, ...persona("BIANCHI LUCA", "BNCLCU") }),
  riga({ iuv: "3", importoCentesimi: 4000, blocchettiConsegnati: 1, stato: "consegnato", ...persona("NERI PAOLO", "NRIPLA") }),
  riga({ iuv: "4", importoCentesimi: 4000, dataPagamento: null, stato: "non_pagato", ...persona("GIALLI ADA", "GLLADA") }),
  // 2 × 20 € accorpati = 1 blocchetto
  riga({ iuv: "5", importoCentesimi: 2000, ...persona("BLU SARA", "BLUSRA") }),
  riga({ iuv: "6", importoCentesimi: 2000, dataPagamento: "2026-11-12T09:00:00", ...persona("BLU SARA", "BLUSRA") }),
  // 60 €: anomalia, 1 consegnabile e 20 € da chiarire
  riga({ iuv: "7", importoCentesimi: 6000, ...persona("ROSA LIA", "RSALIA") }),
  // 20 € già consegnato niente, anomalia senza blocchetti
  riga({ iuv: "8", importoCentesimi: 2000, ...persona("AZZURRI EVA", "ZZREVA") }),
]

test("il registro contiene solo i blocchetti da consegnare, in ordine alfabetico", () => {
  const righe = righeRegistro(anno, { anomalie: false })
  assert.deepEqual(
    righe.map((voce) => voce.debitore),
    ["BIANCHI LUCA", "BLU SARA", "ROSA LIA", "VERDI ANNA"],
  )
  const bianchi = righe[0]
  assert.equal(bianchi.daConsegnare, 1)
  assert.equal(bianchi.totali, 2)
  const blu = righe[1]
  assert.deepEqual(blu.iuv, ["5", "6"])
  assert.equal(blu.daConsegnare, 1)
  assert.equal(blu.dataPagamento, "2026-11-12T09:00:00")
  assert.equal(blu.anomalia, false)
  const rosa = righe[2]
  assert.equal(rosa.anomalia, true)
  assert.equal(rosa.daConsegnare, 1)
  assert.match(rosa.nota ?? "", /20,00/)
  assert.deepEqual(totaliRegistro(righe), { famiglie: 4, blocchetti: 4, importoCentesimi: 4000 + 8000 + 4000 + 6000 })
})

test("con le anomalie entrano anche quelle senza blocchetti consegnabili", () => {
  const righe = righeRegistro(anno, { anomalie: true })
  assert.ok(righe.some((voce) => voce.debitore === "AZZURRI EVA" && voce.anomalia && voce.daConsegnare === 0))
  assert.equal(righe.filter((voce) => voce.debitore === "ROSA LIA").length, 1)
  assert.ok(!righe.some((voce) => voce.debitore === "NERI PAOLO" || voce.debitore === "GIALLI ADA"))
})

test("ricerca e periodo restringono il registro", () => {
  assert.deepEqual(
    righeRegistro(anno, { anomalie: false, ricerca: "verdi" }).map((voce) => voce.debitore),
    ["VERDI ANNA"],
  )
  const periodo = { campo: "pagamento" as const, dal: "2026-11-12", al: "2026-11-12" }
  assert.deepEqual(
    righeRegistro(anno, { anomalie: false, periodo }).map((voce) => voce.debitore),
    ["BLU SARA"],
  )
})

test("il pdf ha carta intestata, stemma e una riga per famiglia", () => {
  const righe = righeRegistro(anno, { anomalie: true })
  const pdf = Buffer.from(
    creaPdfRegistro(righe, {
      annoScolastico: "2026/2027",
      contenuto: "Blocchetti da consegnare e anomalie",
      filtri: null,
      stampatoIl: new Date("2026-11-26T10:00:00Z"),
    }),
  )
  const testo = pdf.toString("latin1")
  assert.match(testo, /^%PDF-1\.4/)
  assert.match(testo, /\/Subtype \/Image/)
  assert.match(testo, /%%EOF\n$/)
  const flussi = [...testo.matchAll(/\/Filter \/FlateDecode \/Length (\d+) >>\nstream\n/g)]
  const contenuti = flussi
    .map((trovato) => {
      const inizio = (trovato.index ?? 0) + trovato[0].length
      try {
        return inflateSync(pdf.subarray(inizio, inizio + Number(trovato[1]))).toString("latin1")
      } catch {
        return ""
      }
    })
    .join("\n")
  assert.match(contenuti, /COMUNE DI SAN LORENZO DEL VALLO/)
  assert.match(contenuti, /Firma di chi ritira/)
  assert.match(contenuti, /AZZURRI EVA/)
  assert.match(contenuti, /Pagina 1 di 1/)
  assert.match(contenuti, /Codice Univoco: UFCXE1/)
})

test("le larghezze del testo seguono le metriche Helvetica", () => {
  assert.equal(larghezzaTesto("ii", "F1", 10), 4.44)
  assert.ok(larghezzaTesto("MM", "F2", 10) > larghezzaTesto("MM", "F1", 10) - 0.01)
})
