import { describe, expect, it } from "vitest"

import { createContactProvider } from "./index.js"
import type { ContactMailConfig, ContactProvider } from "./types.js"

describe("createContactProvider", () => {
  it("returns null when credentials are missing", () => {
    expect(createContactProvider({})).toBeNull()
  })

  it("builds a Brevo provider when shared credentials are present", () => {
    const provider = createContactProvider({
      provider: "brevo",
      apiKey: "xkeysib-test",
      fromEmail: "hello@limetry.com",
      toEmail: "hello@limetry.com",
    })
    expect(provider?.id).toBe("brevo")
  })

  it("uses an injected adapter factory (simple DI)", () => {
    let received: ContactMailConfig | undefined
    const fake = (config: ContactMailConfig): ContactProvider => {
      received = config
      return {
        id: "resend",
        async send() {
          return { ok: true, messageId: "test" }
        },
      }
    }
    const provider = createContactProvider(
      {
        provider: "resend",
        apiKey: "re_test",
        fromEmail: "from@limetry.com",
        fromName: "Limetry",
        toEmail: "inbox@limetry.com",
      },
      { resend: fake },
    )
    expect(provider?.id).toBe("resend")
    expect(received).toEqual({
      apiKey: "re_test",
      fromEmail: "from@limetry.com",
      fromName: "Limetry",
      toEmail: "inbox@limetry.com",
    })
  })
})
