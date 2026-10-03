import { describe, expect, it } from "vitest"

import { describeCliError, describeHttpFailure, isUserCancellation } from "./errors.js"

describe("cli errors", () => {
  it("fills an empty fetch reason with the system code", () => {
    const error = new Error("request to http://localhost:3810/v1/auth/login failed, reason: ")
    Object.assign(error, { code: "ECONNREFUSED", erroredSysCall: "connect" })
    expect(describeCliError(error)).toBe(
      "request to http://localhost:3810/v1/auth/login failed, reason: connect ECONNREFUSED",
    )
  })

  it("keeps a fetch reason that is already present", () => {
    const error = new Error(
      "request to http://127.0.0.1:9/v1/auth/login failed, reason: connect ECONNREFUSED 127.0.0.1:9",
    )
    expect(describeCliError(error)).toContain("ECONNREFUSED 127.0.0.1:9")
  })

  it("uses connection failed when a fetch error has no code", () => {
    const error = new Error("request to http://localhost:3810/v1/auth/login failed, reason:")
    expect(describeCliError(error)).toBe(
      "request to http://localhost:3810/v1/auth/login failed, reason: connection failed",
    )
  })

  it("reads API error text before the HTTP status", () => {
    expect(describeHttpFailure(400, "{\"error\":\"tenantId is required for login\"}")).toBe(
      "tenantId is required for login",
    )
    expect(describeHttpFailure(500, "")).toBe("HTTP 500")
    expect(describeHttpFailure(502, "bad gateway")).toBe("bad gateway")
  })

  it("recognizes prompt cancellation errors", () => {
    expect(isUserCancellation(Object.assign(new Error("closed"), { name: "ExitPromptError" }))).toBe(true)
    expect(isUserCancellation(Object.assign(new Error("closed"), { name: "CancelPromptError" }))).toBe(true)
    expect(isUserCancellation(new Error("ECONNREFUSED"))).toBe(false)
  })
})
