import { describe, expect, it } from "vitest"

import { createPreflightLogger } from "./logger.js"

describe("createPreflightLogger", () => {
  it("disables logging in test environments", () => {
    const logger = createPreflightLogger("Acme API", { NODE_ENV: "test" })
    expect(logger.level).toBe("silent")
  })
})
