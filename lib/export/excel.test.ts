import assert from "node:assert/strict"
import test from "node:test"
import { creaExcel } from "./excel"
import { creaPdf } from "./pdf"
import { fogliExport } from "./tabelle"
import type { RigaElenco } from "@/lib/pagamenti/tipi"

function riga(parziale: Partial<RigaElenco> & Pick<RigaElenco, "iuv" | "importoCentesimi">): RigaElenco {
  return {
    debitore: "ROSSI MARIO",
    cognome: "ROSSI",
    nome: "MARIO",
    codiceFiscale: "AAA",
    tariffaRidotta: false,
    blocchettiDovuti: 0,
    blocchettiConsegnati: 0,
    consegneIl: [],
    dataPagamento: "2026-10-01",
    dataScadenza: "2026-10-16",
    annoScolastico: "2026/2027",
    stato: "da_consegnare",
    ...parziale,
  }
}

test("excel e pdf includono l'elenco e l'audit dell'anno", () => {
  const anno = [
    riga({ iuv: "10", importoCentesimi: 2000 }),
    riga({ iuv: "11", importoCentesimi: 2000 }),
    riga({ iuv: "12", importoCentesimi: 5000, codiceFiscale: "BBB", debitore: "BIANCHI LUCIA", cognome: "BIANCHI", nome: "LUCIA" }),
  ]
  const fogli = fogliExport(anno, anno)
  const excel = creaExcel(fogli)
  assert.match(excel, /ROSSI MARIO/)
  assert.match(excel, /Accorpato/)
  assert.match(excel, /Anomalia/)
  const pdf = Buffer.from(creaPdf("Buoni mensa 2026/2027", fogli)).toString("latin1")
  assert.match(pdf, /^%PDF-1\.4/)
  assert.match(pdf, /ROSSI MARIO/)
  assert.match(pdf, /Audit/)
})
