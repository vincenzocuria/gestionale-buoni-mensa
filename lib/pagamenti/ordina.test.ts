import assert from "node:assert/strict"
import test from "node:test"
import { alternaOrdine, ordinaVoci } from "./ordina"
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
    ["1", "3", "2"],
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
