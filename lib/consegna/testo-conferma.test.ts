import assert from "node:assert/strict"
import test from "node:test"
import { testoConfermaAnnulla, testoConfermaConsegna } from "./testo-conferma"

test("la conferma distingue il blocchetto singolo dall'accorpamento", () => {
  assert.equal(testoConfermaConsegna("ROSSI MARIO", 1), "Confermi la consegna di 1 blocchetto a ROSSI MARIO?")
  assert.equal(
    testoConfermaConsegna("DIANA ANGELA", 1, true),
    "Confermi la consegna di 1 blocchetto a DIANA ANGELA? I versamenti accorpati contano come 1 blocchetto.",
  )
  assert.match(testoConfermaConsegna("BIANCHI", 2), /2 blocchetti/)
})

test("l'annullo avvisa che il pagamento resta", () => {
  assert.match(testoConfermaAnnulla("ROSSI MARIO", 1), /1 blocchetto/)
  assert.match(testoConfermaAnnulla("ROSSI MARIO", 1), /Il pagamento resta/)
  assert.match(testoConfermaAnnulla("ROSSI MARIO", 2), /2 blocchetti/)
})
