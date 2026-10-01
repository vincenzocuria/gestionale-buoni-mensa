import assert from "node:assert/strict"
import test from "node:test"
import { allineaConsegne, leggiConsegne, testoConsegne } from "./tempi"

test("la consegna aggiunge l'orario e l'annullo lo toglie", () => {
  const prima = allineaConsegne([], 1, "2026-10-01T09:15:00")
  assert.deepEqual(prima, ["2026-10-01T09:15:00"])
  const chiusa = allineaConsegne(prima, 2, "2026-10-01T16:40:00")
  assert.deepEqual(chiusa, ["2026-10-01T09:15:00", "2026-10-01T16:40:00"])
  assert.deepEqual(allineaConsegne(chiusa, 0, "2026-10-02T08:00:00"), [])
})

test("un valore illeggibile non inventa orari", () => {
  assert.deepEqual(leggiConsegne(null), [])
  assert.deepEqual(leggiConsegne("{"), [])
  assert.deepEqual(leggiConsegne('["2026-10-01T09:15:00", 1]'), ["2026-10-01T09:15:00"])
})

test("il testo mostra data e ora", () => {
  assert.equal(testoConsegne(["2026-10-01T09:15:00"]), "01/10/2026 09:15")
})
