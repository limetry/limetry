import { describe, expect, it } from "vitest"

import { loadEnv } from "./env.js"
import { collectOssEnvChecks, formatPreflightReport } from "./preflight.js"

describe("Limetry server preflight", () => {
  it("reports bearer, jwt, and optional redis without inventing Clerk or Stripe", () => {
    const env = loadEnv({
      NODE_ENV: "test",
      LIMETRY_BEARER_TOKEN: "test-bearer-token-at-least-16",
      JWT_SECRET: "your-jwt-secret-change-in-production",
    })
    const names = collectOssEnvChecks(env, "test").map((check) => check.name)
    expect(names).toEqual([
      "LIMETRY_BEARER_TOKEN",
      "JWT_SECRET",
      "DECISION_HMAC_SECRET",
      "USE_POSTGRES_STORE",
      "DATABASE_URL",
      "REDIS_URL",
    ])
    expect(names).not.toContain("CLERK_SECRET_KEY")
    expect(names).not.toContain("STRIPE_SECRET_KEY")
  })

  it("marks postgres required only when the durable store is on", () => {
    const env = loadEnv({
      NODE_ENV: "test",
      LIMETRY_BEARER_TOKEN: "test-bearer-token-at-least-16",
      JWT_SECRET: "your-jwt-secret-change-in-production",
      USE_POSTGRES_STORE: "true",
      DATABASE_URL: "postgresql://limetry:limetry@db.example.com:5432/limetry",
    })
    const database = collectOssEnvChecks(env, "test").find((check) => check.name === "DATABASE_URL")
    expect(database?.required).toBe(true)
    expect(database?.detail).toBe("postgresql://db.example.com:5432/limetry")
  })

  it("obfuscates secrets in the report", () => {
    const env = loadEnv({
      NODE_ENV: "test",
      LIMETRY_BEARER_TOKEN: "test-bearer-token-at-least-16",
      JWT_SECRET: "your-jwt-secret-change-in-production",
    })
    const bearer = collectOssEnvChecks(env, "test").find((check) => check.name === "LIMETRY_BEARER_TOKEN")
    expect(bearer?.detail).toBe("••••••••••")
    expect(bearer?.detail).not.toContain("test-bearer-token-at-least-16")
  })

  it("formats a human-readable banner with masked secrets", () => {
    const report = formatPreflightReport({
      product: "Limetry",
      envFiles: "../.env, ../.env.local",
      configuration: [
        "NODE_ENV: development",
        "JWT_SECRET: ••••••••••",
        "DATABASE_URL: postgresql://localhost:5432/limetry",
        "DB Endpoint: postgresql://localhost:5432",
        "DB Name:     limetry",
      ],
      connectivity: ["✅ Database connected successfully (114ms)."],
      passed: true,
      warnings: false,
    })
    expect(report).toContain("🚀 Limetry: Starting Preflight Check")
    expect(report).toContain("🔍 Environment Configuration:")
    expect(report).toContain("  • JWT_SECRET: ••••••••••")
    expect(report).toContain("✅ Database connected successfully (114ms).")
    expect(report).toContain("✨ Preflight Check Passed!")
    expect(report).not.toContain("preflight.ready")
  })
})
