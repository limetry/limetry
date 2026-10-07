import { describe, expect, it } from "vitest"

import { clearAuthSession, type CliConfig,getAuthToken } from "./config.js"

describe("CLI authentication configuration", () => {
  it("prefers a Cloud access token over a legacy API key", () => {
    const config: CliConfig = {
      baseUrl: "https://api.limetry.com",
      apiKey: "legacy",
      accessToken: "access",
      authProvider: "cloud",
    }
    expect(getAuthToken(config)).toBe("access")
  })

  it("clears refreshable credentials without changing the API endpoint", () => {
    const config: CliConfig = {
      baseUrl: "https://api.limetry.com",
      apiKey: "access",
      accessToken: "access",
      refreshToken: "refresh",
      accessTokenExpiresAt: Date.now(),
      authProvider: "cloud",
    }
    expect(clearAuthSession(config)).toEqual({
      baseUrl: "https://api.limetry.com",
      apiKey: "",
      authProvider: "cloud",
    })
  })
})
