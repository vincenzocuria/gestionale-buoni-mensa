import assert from "node:assert/strict"
import test from "node:test"
import { chiavePersonaAnno } from "./persona"
import { storicoPersona } from "./storico"
import type { RigaElenco } from "./tipi"

function riga(parziale: Partial<RigaElenco> & Pick<RigaElenco, "iuv" | "annoScolastico">): RigaElenco {
  return {
    debitore: "ROSSI MARIO",
    cognome: "ROSSI",
    nome: "MARIO",
    codiceFiscale: "RSSMRA80A01H501U",
    importoCentesimi: 4000,
    tariffaRidotta: false,
    blocchettiDovuti: 1,
    blocchettiConsegnati: 0,
    consegneIl: [],
    dataPagamento: "2026-10-01",
    dataScadenza: "2026-10-15",
    stato: "da_consegnare",
    ...parziale,
  }
}

test("lo storico della persona riunisce gli anni e gli orari", () => {
  const attuale = riga({
    iuv: "1",
    annoScolastico: "2026/2027",
    blocchettiConsegnati: 1,
    consegneIl: ["2026-10-01T11:30:00"],
    stato: "consegnato",
  })
  const prossimo = riga({
    iuv: "9",
    annoScolastico: "2027/2028",
    dataPagamento: "2027-09-15",
    consegneIl: ["2027-09-16T08:00:00"],
    blocchettiConsegnati: 1,
    stato: "consegnato",
  })
  const altro = riga({ iuv: "3", annoScolastico: "2026/2027", codiceFiscale: "ALTRO", debitore: "BIANCHI" })
  const storico = storicoPersona([attuale, prossimo, altro], chiavePersonaAnno(attuale))
  assert.deepEqual(
    storico?.anni.map((anno) => anno.annoScolastico),
    ["2027/2028", "2026/2027"],
  )
  assert.equal(storico?.anni[1]?.voci.length, 1)
  assert.deepEqual(
    storico?.consegne.map((voce) => voce.iuv),
    ["9", "1"],
  )
  assert.equal(storico?.codiceFiscale, "RSSMRA80A01H501U")
})
