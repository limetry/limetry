import { describe, expect, it } from "vitest"

import {
  isTerminalFailure,
  isTerminalSuccess,
  parseWatchArgs,
  pickDeployment,
} from "./watch-vercel.js"

describe("watch-vercel", () => {
  it("parses sha and timeout flags", () => {
    expect(parseWatchArgs(["--sha", "abc123", "--timeout-ms", "60000"])).toEqual({
      sha: "abc123",
      timeoutMs: 60000,
      help: false,
    })
  })

  it("prefers production deployments", () => {
    const picked = pickDeployment([
      { url: "preview.example", target: null, state: "READY" },
      { url: "prod.example", target: "production", state: "BUILDING" },
    ])
    expect(picked?.url).toBe("prod.example")
  })

  it("classifies terminal states", () => {
    expect(isTerminalSuccess("READY")).toBe(true)
    expect(isTerminalFailure("ERROR")).toBe(true)
    expect(isTerminalFailure("CANCELED")).toBe(true)
    expect(isTerminalSuccess("BUILDING")).toBe(false)
  })
})
