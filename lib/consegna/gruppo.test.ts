import assert from "node:assert/strict"
import test from "node:test"
import { analizzaBlocchetti } from "../audit/gruppi"
import type { RigaAudit } from "../audit/tipi"
import { pianoOrarioGruppo } from "./gruppo"

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

test("sul gruppo l'orario si modifica e la rimozione scala un blocchetto", () => {
  const analisi = analizzaBlocchetti([
    riga({ iuv: "10", importoCentesimi: 2000, blocchettiConsegnati: 1, consegneIl: ["2026-10-01T11:30:00"] }),
    riga({ iuv: "11", importoCentesimi: 2000 }),
  ])
  const gruppo = analisi.gruppi[0]
  const modificato = pianoOrarioGruppo(gruppo, "modifica", 0, "2026-10-06T09:00")
  assert.equal(modificato.ok, true)
  if (!modificato.ok) return
  assert.deepEqual(modificato.piano, [
    { iuv: "10", consegnati: 1, consegneIl: ["2026-10-06T09:00:00"] },
    { iuv: "11", consegnati: 0, consegneIl: [] },
  ])
  const tolto = pianoOrarioGruppo(gruppo, "rimuovi", 0, null)
  assert.equal(tolto.ok, true)
  if (!tolto.ok) return
  assert.equal(tolto.piano[0]?.consegnati, 0)
  assert.deepEqual(tolto.piano[0]?.consegneIl, [])
})
