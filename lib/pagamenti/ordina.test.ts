import assert from "node:assert/strict"
import test from "node:test"
import { alternaOrdine, ordinaVoci } from "./ordina"
import type { GruppoAudit } from "../audit/tipi"
import type { VoceElenco } from "./voci"
import type { RigaElenco } from "./tipi"

function riga(parziale: Partial<RigaElenco> & Pick<RigaElenco, "iuv" | "debitore">): VoceElenco {
  const voce: RigaElenco = {
    iuv: parziale.iuv,
    debitore: parziale.debitore,
    cognome: parziale.debitore,
    nome: "",
    codiceFiscale: "",
    importoCentesimi: parziale.importoCentesimi ?? 4000,
    tariffaRidotta: false,
    blocchettiDovuti: 1,
    blocchettiConsegnati: 0,
    consegneIl: [],
    dataPagamento: parziale.dataPagamento === undefined ? "2026-10-01" : parziale.dataPagamento,
    dataScadenza: parziale.dataScadenza ?? "2026-10-15",
    annoScolastico: "2026/2027",
    stato: parziale.stato ?? "da_consegnare",
  }
  return { tipo: "singola", id: voce.iuv, riga: voce }
}

test("il debitore si ordina in italiano e la data mette i vuoti in fondo", () => {
  const voci = [
    riga({ iuv: "2", debitore: "ZETA" }),
    riga({ iuv: "1", debitore: "ALFA", dataPagamento: null, stato: "non_pagato" }),
    riga({ iuv: "3", debitore: "MARIO", dataPagamento: "2026-09-01" }),
  ]
  assert.deepEqual(
    ordinaVoci(voci, { colonna: "debitore", verso: "asc" }).map((voce) => voce.id),
    ["3", "2", "1"],
  )
  assert.deepEqual(
    ordinaVoci(voci, { colonna: "pagamento", verso: "desc" }).map((voce) => voce.id),
    ["2", "3", "1"],
  )
})

test("il secondo clic sulla stessa colonna inverte il verso", () => {
  assert.deepEqual(alternaOrdine(null, "debitore"), { colonna: "debitore", verso: "asc" })
  assert.deepEqual(alternaOrdine({ colonna: "debitore", verso: "asc" }, "debitore"), {
    colonna: "debitore",
    verso: "desc",
  })
  assert.equal(alternaOrdine(null, "pagamento").verso, "desc")
})

function gruppo(id: string, debitore: string, consegnati: number, righe: VoceElenco[]): VoceElenco {
  const membri = righe.map((voce) => (voce.tipo === "singola" ? voce.riga : voce.righe[0]!))
  const dati: GruppoAudit = {
    id,
    annoScolastico: "2026/2027",
    debitore,
    esito: "accorpato",
    pagamenti: membri.map((membro) => ({
      iuv: membro.iuv,
      importoCentesimi: membro.importoCentesimi,
      dataPagamento: membro.dataPagamento,
      codiceFiscale: "",
      debitore,
      cognome: debitore,
      nome: "",
      annoScolastico: "2026/2027",
      blocchettiConsegnati: membro.blocchettiConsegnati,
    })),
    sommaCentesimi: 4000,
    blocchetti: 1,
    consegnati,
    testo: "",
  }
  return { tipo: "gruppo", id, gruppo: dati, righe: membri }
}

test("senza scelta: prima i da consegnare (anche i gruppi), poi il resto dal pagamento più recente", () => {
  const voci = [
    riga({ iuv: "a", debitore: "ANNA", dataPagamento: "2026-10-21", stato: "consegnato" }),
    gruppo("g-consegnato", "DIANA", 1, [
      riga({ iuv: "d1", debitore: "DIANA", dataPagamento: "2026-09-30" }),
      riga({ iuv: "d2", debitore: "DIANA", dataPagamento: null, stato: "non_pagato" }),
    ]),
    riga({ iuv: "b", debitore: "BRUNO", dataPagamento: "2026-10-21" }),
    gruppo("g-da-consegnare", "SIRI", 0, [
      riga({ iuv: "s1", debitore: "SIRI", dataPagamento: "2026-10-16", stato: "consegnato" }),
      riga({ iuv: "s2", debitore: "SIRI", dataPagamento: null, stato: "non_pagato" }),
    ]),
    riga({ iuv: "n", debitore: "NINO", dataPagamento: null, stato: "non_pagato" }),
    riga({ iuv: "c", debitore: "CARLA", dataPagamento: "2026-10-01" }),
  ]
  assert.deepEqual(
    ordinaVoci(voci, null).map((voce) => voce.id),
    ["b", "g-da-consegnare", "c", "a", "g-consegnato", "n"],
  )
  assert.deepEqual(
    ordinaVoci(voci, { colonna: "debitore", verso: "asc" }).map((voce) => voce.id),
    ["b", "c", "g-da-consegnare", "a", "g-consegnato", "n"],
  )
})
