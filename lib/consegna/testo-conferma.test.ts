import assert from "node:assert/strict"
import test from "node:test"
import { testoConfermaConsegna } from "./testo-conferma"

test("la conferma distingue il blocchetto singolo dall'accorpamento", () => {
  assert.equal(testoConfermaConsegna("ROSSI MARIO", 1), "Confermi la consegna di 1 blocchetto a ROSSI MARIO?")
  assert.equal(
    testoConfermaConsegna("DIANA ANGELA", 1, true),
    "Confermi la consegna di 1 blocchetto a DIANA ANGELA? I versamenti accorpati contano come 1 blocchetto.",
  )
  assert.match(testoConfermaConsegna("BIANCHI", 2), /2 blocchetti/)
})
