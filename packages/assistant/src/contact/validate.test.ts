import { describe, expect, it } from "vitest"

import { parseContactMessage } from "./validate.js"

describe("parseContactMessage", () => {
  it("accepts a valid contact payload", () => {
    const result = parseContactMessage({
      name: "Ada Lovelace",
      email: "ada@example.com",
      message: "Hello from the analytical engine era.",
      company: "Analytical Engines",
      source: "contact-page",
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.message.email).toBe("ada@example.com")
      expect(result.message.company).toBe("Analytical Engines")
    }
  })

  it("rejects short messages and invalid email", () => {
    expect(parseContactMessage({
      name: "Ada",
      email: "not-an-email",
      message: "too short",
    }).ok).toBe(false)
  })
})
