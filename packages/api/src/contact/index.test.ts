import { describe, expect, it } from "vitest"

import { createContactProvider } from "./index.js"

describe("createContactProvider", () => {
  it("returns null when Brevo credentials are missing", () => {
    expect(createContactProvider({})).toBeNull()
  })

  it("builds a Brevo provider when credentials are present", () => {
    const provider = createContactProvider({
      CONTACT_PROVIDER: "brevo",
      BREVO_API_KEY: "xkeysib-test",
      BREVO_FROM_EMAIL: "hello@limetry.com",
      BREVO_CONTACT_TO: "hello@limetry.com",
    })
    expect(provider?.id).toBe("brevo")
  })
})
