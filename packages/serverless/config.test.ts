import { describe, expect, it } from "vitest"

import {
  buildServerlessConfig,
  parseBoolean,
  parseServerlessProvider,
} from "./config"

describe("buildServerlessConfig", () => {
  it("uses AWS SQLite defaults", () => {
    const config = buildServerlessConfig({})

    expect(config.cloudProvider).toBe("aws")
    expect(config.location).toBe("us-west-2")
    expect(config.managedDatabase).toBe(false)
    expect(config.sqliteDatabasePath).toBe("/tmp/limetry.sqlite")
  })

  it("parses provider-specific deployment settings", () => {
    const config = buildServerlessConfig({
      LIMETRY_ALLOW_PUBLIC_DATABASE: "true",
      LIMETRY_API_DOMAIN: "https://api.example.com/",
      LIMETRY_CLOUD_PROVIDER: "azure",
      LIMETRY_LOCATION: "eastus",
      LIMETRY_MANAGED_DATABASE: "true",
      LIMETRY_MAX_INSTANCES: "4",
      LIMETRY_MEMORY_MB: "1024",
      LIMETRY_MIN_INSTANCES: "1",
      LIMETRY_TIMEOUT_SECONDS: "60",
    })

    expect(config.apiDomain).toBe("api.example.com")
    expect(config.allowPublicDatabase).toBe(true)
    expect(config.cloudProvider).toBe("azure")
    expect(config.location).toBe("eastus")
    expect(config.managedDatabase).toBe(true)
    expect(config.maxInstances).toBe(4)
    expect(config.minInstances).toBe(1)
  })

  it("rejects invalid boolean and scaling values", () => {
    expect(() => parseBoolean("yes", false)).toThrow(/true/)
    expect(() => buildServerlessConfig({ LIMETRY_MAX_INSTANCES: "0" })).toThrow(/at least 1/)
  })
})

describe("parseServerlessProvider", () => {
  it("accepts all supported providers", () => {
    expect(parseServerlessProvider("aws")).toBe("aws")
    expect(parseServerlessProvider("gcp")).toBe("gcp")
    expect(parseServerlessProvider("azure")).toBe("azure")
  })

  it("defaults to AWS when no provider is supplied", () => {
    expect(parseServerlessProvider(undefined)).toBe("aws")
  })
})
