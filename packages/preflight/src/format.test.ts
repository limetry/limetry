import { describe, expect, it } from "vitest"

import { envCheck } from "./checks.js"
import { formatPreflightReport, PREFLIGHT_SEPARATOR } from "./format.js"

describe("formatPreflightReport", () => {
  it("formats a human-readable banner with masked secrets and listen URLs", () => {
    const report = formatPreflightReport({
      product: "Acme API",
      appVersion: "1.0.001",
      envFiles: "../.env, ../.env.local",
      configuration: [
        "NODE_ENV: development",
        "JWT_SECRET: ••••••••••",
        "DATABASE_URL: postgresql://localhost:5432/app",
        "DB Endpoint: postgresql://localhost:5432",
        "DB Name:     app",
      ],
      connectivity: ["✅ Database connected successfully (114ms)."],
      passed: true,
      warnings: false,
      listenUrls: ["http://localhost:3810"],
    })
    expect(report).toContain("🚀 Acme API: Starting Preflight Check")
    expect(report).toContain("✅ App Version: 1.0.001")
    expect(report).toContain("🔍 Environment Configuration:")
    expect(report).toContain("  • JWT_SECRET: ••••••••••")
    expect(report).toContain("✅ Database connected successfully (114ms).")
    expect(report).toContain("✨ Preflight Check Passed!")
    expect(report).toContain("🚀 http://localhost:3810")
    expect(report).toContain(PREFLIGHT_SEPARATOR)
    expect(report).not.toContain("preflight.ready")
  })

  it("groups env and connectivity into Required and Optional", () => {
    const report = formatPreflightReport({
      product: "Acme API",
      envFiles: "none (process.env only)",
      envChecks: [
        envCheck({
          name: "JWT_SECRET",
          value: "x".repeat(32),
          secret: true,
          ok: true,
          required: true,
        }),
        envCheck({
          name: "STRIPE_WEBHOOK_SECRET",
          value: "",
          secret: true,
          ok: false,
          required: true,
          critical: false,
        }),
        envCheck({
          name: "REDIS_URL",
          value: "",
          ok: true,
          required: false,
        }),
      ],
      contextLines: ["NODE_ENV: production", "LIMETRY_API_PORT: 3810"],
      connectivityChecks: [
        {
          name: "postgres",
          ok: true,
          required: true,
          detail: "Database connected successfully (12ms).",
          kind: "connectivity",
        },
        {
          name: "stripe",
          ok: false,
          required: true,
          critical: false,
          detail: "Stripe API unreachable (12ms): timeout",
          kind: "connectivity",
        },
        {
          name: "redis",
          ok: false,
          required: false,
          detail: "Redis connection failed (1ms): down",
          kind: "connectivity",
        },
      ],
      passed: true,
      warnings: true,
    })
    expect(report).toContain("  Required:")
    expect(report).toContain("  Optional:")
    expect(report).toContain("  Context:")
    expect(report).toContain("✅ JWT_SECRET:")
    expect(report).toContain("⚠️ STRIPE_WEBHOOK_SECRET:")
    expect(report).toContain("⚠️ Stripe API unreachable")
    expect(report).toContain("⚠️ Redis connection failed")
    expect(report).toContain("NODE_ENV: production")
    expect(report).toContain("⚠️ Preflight Check Passed with warnings.")
  })

  it("reports warnings and failures", () => {
    const warned = formatPreflightReport({
      product: "Acme API",
      envFiles: "none (process.env only)",
      configuration: ["NODE_ENV: development"],
      connectivity: ["⚠️ Redis connection failed (12ms): connect ECONNREFUSED"],
      passed: true,
      warnings: true,
    })
    expect(warned).toContain("⚠️ Preflight Check Passed with warnings.")

    const failed = formatPreflightReport({
      product: "Acme API",
      envFiles: "none (process.env only)",
      configuration: ["NODE_ENV: production"],
      connectivity: ["❌ Database connection failed (12ms): timeout"],
      passed: false,
      warnings: false,
    })
    expect(failed).toContain("❌ Preflight Check Failed!")
  })
})
