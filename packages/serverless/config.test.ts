import { describe, expect, it } from "vitest"

import {
  buildServerlessConfig,
  defaultApiDomain,
  defaultNeonDatabaseName,
  parseBoolean,
  parseDatabaseProvider,
  parseServerlessProvider,
} from "./config"

describe("buildServerlessConfig", () => {
  it("uses AWS SQLite defaults", () => {
    const config = buildServerlessConfig({})

    expect(config.cloudProvider).toBe("aws")
    expect(config.location).toBe("us-west-2")
    expect(config.databaseProvider).toBe("sqlite")
    expect(config.managedDatabase).toBe(false)
    expect(config.sqliteDatabasePath).toBe("/tmp/limetry.sqlite")
    expect(config.apiDomain).toBe("serverless-cloud.dev.limetry.org")
    expect(config.neonDatabaseName).toBe("limetry-serverless-cloud-dev")
  })

  it("parses provider-specific deployment settings", () => {
    const config = buildServerlessConfig({
      LIMETRY_ALLOW_PUBLIC_DATABASE: "true",
      LIMETRY_API_DOMAIN: "https://api.example.com/",
      LIMETRY_CLOUD_PROVIDER: "azure",
      LIMETRY_LOCATION: "eastus",
      LIMETRY_DATABASE_PROVIDER: "neon",
      LIMETRY_MAX_INSTANCES: "4",
      LIMETRY_MEMORY_MB: "1024",
      LIMETRY_MIN_INSTANCES: "1",
      LIMETRY_TIMEOUT_SECONDS: "60",
    })

    expect(config.apiDomain).toBe("api.example.com")
    expect(config.allowPublicDatabase).toBe(true)
    expect(config.cloudProvider).toBe("azure")
    expect(config.location).toBe("eastus")
    expect(config.databaseProvider).toBe("neon")
    expect(config.maxInstances).toBe(4)
    expect(config.minInstances).toBe(1)
  })

  it("uses production defaults for API and Neon database names", () => {
    const config = buildServerlessConfig({}, "production")

    expect(config.apiDomain).toBe("serverless-cloud.limetry.org")
    expect(config.neonDatabaseName).toBe("limetry-serverless-cloud-prod")
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

describe("default deployment names", () => {
  it("normalizes production stage aliases", () => {
    expect(defaultApiDomain("prod")).toBe("serverless-cloud.limetry.org")
    expect(defaultNeonDatabaseName("prod")).toBe("limetry-serverless-cloud-prod")
  })

  it("creates isolated names for non-production stages", () => {
    expect(defaultApiDomain("preview-1")).toBe("serverless-cloud.preview-1.limetry.org")
    expect(defaultNeonDatabaseName("preview-1")).toBe("limetry-serverless-cloud-preview-1")
  })
})

describe("parseDatabaseProvider", () => {
  it("defaults to SQLite and supports legacy managed database selection", () => {
    expect(parseDatabaseProvider(undefined)).toBe("sqlite")
    expect(parseDatabaseProvider(undefined, false)).toBe("sqlite")
    expect(parseDatabaseProvider("rds")).toBe("rds")
  })

  it("rejects RDS for non-AWS compute", () => {
    expect(() => buildServerlessConfig({
      LIMETRY_CLOUD_PROVIDER: "gcp",
      LIMETRY_DATABASE_PROVIDER: "rds",
    })).toThrow("requires LIMETRY_CLOUD_PROVIDER=aws")
  })
})
