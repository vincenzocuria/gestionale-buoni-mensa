import assert from "node:assert/strict"
import test from "node:test"
import { passwordCorretta } from "./sessione"

test("la password coincide solo con il valore esatto della variabile", () => {
  const precedente = process.env.UFFICIO_PASSWORD
  process.env.UFFICIO_PASSWORD = "segreto-di-prova"
  try {
    assert.equal(passwordCorretta("segreto-di-prova"), true)
    assert.equal(passwordCorretta("segreto-di-prova "), false)
    assert.equal(passwordCorretta("altro"), false)
  } finally {
    if (precedente == null) delete process.env.UFFICIO_PASSWORD
    else process.env.UFFICIO_PASSWORD = precedente
  }
})
