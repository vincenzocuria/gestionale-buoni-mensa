import assert from "node:assert/strict"
import test from "node:test"
import { formatDataIt } from "./data-it"

test("un istante UTC si legge nell'ora italiana", () => {
  assert.equal(formatDataIt("2026-10-05T07:42:46Z"), "05/10/2026 09:42")
  assert.equal(formatDataIt("2026-10-01T09:15:00"), "01/10/2026 09:15")
  assert.equal(formatDataIt("2026-09-24"), "24/09/2026")
})
