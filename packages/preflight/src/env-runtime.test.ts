import { describe, expect, it } from "vitest"

import {
  isNextBuildPhase,
  isProductionRuntime,
  isTestEnv,
  shouldFailHard,
  shouldProbeConnectivity,
} from "./env-runtime.js"

describe("env runtime helpers", () => {
  it("detects test, build, and production", () => {
    expect(isTestEnv({ NODE_ENV: "test" })).toBe(true)
    expect(isTestEnv({ VITEST: "true" })).toBe(true)
    expect(isNextBuildPhase({ NEXT_PHASE: "phase-production-build" })).toBe(true)
    expect(isNextBuildPhase({ NEXT_PHASE: "phase-export" })).toBe(true)
    expect(isNextBuildPhase({ LIMETRY_STATIC_EXPORT: "1", NODE_ENV: "production" })).toBe(true)
    expect(isProductionRuntime({ NODE_ENV: "production" })).toBe(true)
    expect(isProductionRuntime({ VERCEL_ENV: "production" })).toBe(true)
    expect(isProductionRuntime({ NODE_ENV: "development" })).toBe(false)
  })

  it("skips connectivity in test and Next build", () => {
    expect(shouldProbeConnectivity({ NODE_ENV: "test" })).toBe(false)
    expect(shouldProbeConnectivity({ NEXT_PHASE: "phase-production-build" })).toBe(false)
    expect(shouldProbeConnectivity({ LIMETRY_STATIC_EXPORT: "1", NODE_ENV: "production" })).toBe(false)
    expect(shouldProbeConnectivity({ NODE_ENV: "development" })).toBe(true)
  })

  it("only hard-fails live production runtimes", () => {
    expect(shouldFailHard({ NODE_ENV: "production" })).toBe(true)
    expect(shouldFailHard({ NODE_ENV: "production", NEXT_PHASE: "phase-production-build" })).toBe(false)
    expect(shouldFailHard({ NODE_ENV: "production", LIMETRY_STATIC_EXPORT: "1" })).toBe(false)
    expect(shouldFailHard({ NODE_ENV: "test" })).toBe(false)
    expect(shouldFailHard({ NODE_ENV: "development" })).toBe(false)
  })
})
