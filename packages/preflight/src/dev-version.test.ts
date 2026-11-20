import { describe, expect, it } from "vitest"

import { seedDevVersionEnv } from "./dev-version.js"

describe("seedDevVersionEnv", () => {
  it("no-ops in production and test", () => {
    const prod: NodeJS.ProcessEnv = { NODE_ENV: "production" }
    expect(seedDevVersionEnv(process.cwd(), prod)).toBe(0)
    expect(prod.LIMETRY_DEV_COMMITS).toBeUndefined()

    const testEnv: NodeJS.ProcessEnv = { NODE_ENV: "test" }
    expect(seedDevVersionEnv(process.cwd(), testEnv)).toBe(0)
    expect(testEnv.LIMETRY_DEV_COMMITS).toBeUndefined()
  })

  it("honors an existing LIMETRY_DEV_COMMITS value", () => {
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: "development",
      LIMETRY_DEV_COMMITS: "9",
    }
    expect(seedDevVersionEnv(process.cwd(), env)).toBe(9)
    expect(env.NEXT_PUBLIC_LIMETRY_DEV_COMMITS).toBe("9")
    expect(env.EXPO_PUBLIC_LIMETRY_DEV_COMMITS).toBe("9")
  })
})
