import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { getContactAdapter } from "./index.js"

describe("getContactAdapter", () => {
  it("defaults to Brevo", () => {
    assert.equal(getContactAdapter(undefined).id, "brevo")
  })

  it("resolves Formspree case-insensitively", () => {
    assert.equal(getContactAdapter("Formspree").id, "formspree")
  })
})
