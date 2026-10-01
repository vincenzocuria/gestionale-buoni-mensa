import assert from "node:assert/strict"
import test from "node:test"
import { calcolaBlocchetti } from "./calcola"

test("solo 40 euro o multipli contano come blocchetti", () => {
  assert.deepEqual(calcolaBlocchetti(4000), { dovuti: 1, tariffaRidotta: false })
  assert.deepEqual(calcolaBlocchetti(8000), { dovuti: 2, tariffaRidotta: false })
  assert.equal(calcolaBlocchetti(12000).dovuti, 3)
  assert.equal(calcolaBlocchetti(2000).dovuti, 0)
  assert.equal(calcolaBlocchetti(3000).dovuti, 0)
  assert.equal(calcolaBlocchetti(5000).dovuti, 0)
  assert.equal(calcolaBlocchetti(7000).dovuti, 0)
  assert.equal(calcolaBlocchetti(0).dovuti, 0)
})
