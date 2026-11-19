import { describe, expect, it } from "vitest"

import { getContactAdapter } from "./index.js"

describe("getContactAdapter", () => {
  it("defaults to Brevo", () => {
    expect(getContactAdapter(undefined).id).toBe("brevo")
  })

  it("resolves Formspree case-insensitively", () => {
    expect(getContactAdapter("Formspree").id).toBe("formspree")
  })
})
