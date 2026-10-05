import assert from "node:assert/strict"
import test from "node:test"
import { isoGiornoItalia, isoOraItalia } from "./ora-italia"

test("l'orario di ufficio è quello di Roma, anche se l'istante è UTC", () => {
  assert.equal(isoOraItalia(new Date("2026-10-05T07:42:46Z")), "2026-10-05T09:42:46")
  assert.equal(isoOraItalia(new Date("2026-01-15T07:42:46Z")), "2026-01-15T08:42:46")
  assert.equal(isoGiornoItalia(new Date("2026-10-05T22:30:00Z")), "2026-10-06")
})
