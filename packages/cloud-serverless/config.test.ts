import { describe, expect, it } from "vitest"

import {
  buildServerEnvironment,
  buildServerlessConfig,
  parseDatabaseProvider,
  parseServerlessProvider,
} from "./config"

/** Verifies portable serverless configuration and runtime environment helpers. */
describe("serverless configuration", () => {
  /** Verifies supported provider parsing and invalid provider rejection. */
  it("parses supported serverless providers", () => {
    expect(parseServerlessProvider(undefined)).toBe("aws")
    expect(parseServerlessProvider("gcp")).toBe("gcp")
    expect(parseServerlessProvider("azure")).toBe("azure")
    expect(() => parseServerlessProvider("unknown")).toThrow("Unsupported serverless provider")
  })

  /** Verifies provider-specific serverless defaults. */
  it("builds provider-specific defaults", () => {
    expect(buildServerlessConfig({ cloudProvider: "aws" })).toMatchObject({
      cloudProvider: "aws",
      location: "us-west-2",
      databaseProvider: "neon",
      managedDatabase: true,
      neonProjectName: "limetry-serverless",
      sqliteDatabasePath: "/tmp/limetry.sqlite",
    })
    expect(buildServerlessConfig({ allowPublicDatabase: true }).allowPublicDatabase).toBe(true)
    expect(buildServerlessConfig({ cloudProvider: "gcp" })).toMatchObject({
      location: "us-central1",
      memoryMb: 512,
    })
    expect(buildServerlessConfig({ cloudProvider: "azure" })).toMatchObject({
      location: "westus2",
      memoryMb: 512,
    })
  })

  /** Verifies custom API hostnames are normalized and infer their DNS zone. */
  it("normalizes custom API domains", () => {
    expect(buildServerlessConfig({ apiDomain: "https://API.dev.example.com/" })).toMatchObject({
      apiDomain: "api.dev.example.com",
      apiDomainZone: "example.com",
      manageCloudflare: true,
    })
    expect(() => buildServerlessConfig({ apiDomain: "https://example.com/path" }))
      .toThrow("apiDomain")
  })

  /** Verifies serverless sizing validation. */
  it("validates instance sizing", () => {
    expect(() => buildServerlessConfig({ minInstances: -1 })).toThrow("minInstances")
    expect(() => buildServerlessConfig({ maxInstances: 0 })).toThrow("maxInstances")
    expect(() => buildServerlessConfig({ maxInstances: 1, minInstances: 2 })).toThrow("maxInstances")
    expect(() => buildServerlessConfig({ memoryMb: 64 })).toThrow("memoryMb")
  })

  /** Verifies Neon, RDS, and SQLite runtime environments. */
  it("builds persistence-specific server environments", () => {
    const sqliteConfig = buildServerlessConfig({ databaseProvider: "sqlite" })
    const managedConfig = buildServerlessConfig({ databaseProvider: "neon" })
    const secrets = {
      bearerToken: "bearer",
      decisionHmacSecret: "hmac",
      jwtSecret: "jwt",
    }

    expect(buildServerEnvironment(sqliteConfig, secrets)).toMatchObject({
      SQLITE_DATABASE_PATH: "/tmp/limetry.sqlite",
      USE_POSTGRES_STORE: "false",
    })
    expect(buildServerEnvironment(managedConfig, secrets).USE_POSTGRES_STORE).toBe("true")
  })

  /** Verifies database provider defaults and AWS-only RDS validation. */
  it("selects database providers by configuration", () => {
    expect(parseDatabaseProvider(undefined)).toBe("neon")
    expect(parseDatabaseProvider(undefined, false)).toBe("sqlite")
    expect(parseDatabaseProvider("rds")).toBe("rds")
    expect(() => buildServerlessConfig({
      cloudProvider: "gcp",
      databaseProvider: "rds",
    })).toThrow("requires cloudProvider=aws")
  })
})
