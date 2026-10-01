import assert from "node:assert/strict"
import test from "node:test"
import { slicePagina } from "./pagina"

test("la pagina resta nei limiti dell'elenco", () => {
  const righe = Array.from({ length: 30 }, (_, indice) => indice + 1)
  const prima = slicePagina(righe, 1, 25)
  assert.equal(prima.voci.length, 25)
  assert.equal(prima.dal, 1)
  assert.equal(prima.al, 25)
  assert.equal(prima.pagine, 2)
  const seconda = slicePagina(righe, 9, 25)
  assert.deepEqual(seconda.voci, [26, 27, 28, 29, 30])
  assert.equal(seconda.pagina, 2)
})
