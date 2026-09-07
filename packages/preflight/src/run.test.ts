import { describe, expect, it, vi } from "vitest"

import { connectivityIcon, envCheck } from "./checks.js"
import { runPreflight } from "./run.js"

describe("envCheck", () => {
  it("masks secrets and records optional connectivity icons", () => {
    const secret = envCheck({
      name: "JWT_SECRET",
      value: "super-secret-value",
      secret: true,
      ok: true,
      required: true,
    })
    expect(secret.detail).toBe("••••••••••")
    expect(secret.kind).toBe("secret")
    expect(connectivityIcon({ ok: true, required: true })).toBe("✅")
    expect(connectivityIcon({ ok: false, required: false })).toBe("⚠️")
    expect(connectivityIcon({ ok: false, required: true })).toBe("❌")
    expect(connectivityIcon({ ok: false, required: true, critical: false })).toBe("⚠️")
  })
})

describe("runPreflight", () => {
  it("runs probes, prints listen URLs, and continues on optional failures", async () => {
    const checks = await runPreflight({
      product: "Acme API",
      env: { NODE_ENV: "development" },
      skipConnectivity: false,
      envChecks: [
        envCheck({ name: "JWT_SECRET", value: "x".repeat(32), secret: true, ok: true, required: true }),
      ],
      configuration: ["NODE_ENV: development"],
      listenUrl: "http://localhost:3810",
      probes: [
        {
          name: "redis",
          required: false,
          run: async () => ({ ok: false, detail: "Redis connection failed (1ms): down" }),
        },
      ],
    })
    expect(checks.map((check) => check.name)).toEqual(["JWT_SECRET", "redis"])
    expect(checks.find((check) => check.name === "redis")?.ok).toBe(false)
  })

  it("skips probes in test environments", async () => {
    const run = vi.fn(async () => ({ ok: true, detail: "should not run" }))
    const checks = await runPreflight({
      product: "Acme API",
      env: { NODE_ENV: "test" },
      probes: [{ name: "postgres", required: true, run }],
    })
    expect(run).not.toHaveBeenCalled()
    expect(checks).toEqual([])
  })

  it("throws only when required checks fail in production", async () => {
    await expect(runPreflight({
      product: "Acme API",
      env: { NODE_ENV: "production" },
      envChecks: [
        envCheck({ name: "DATABASE_URL", value: "", ok: false, required: true }),
      ],
      failHard: true,
    })).rejects.toThrow(/Preflight failed: DATABASE_URL/)

    const checks = await runPreflight({
      product: "Acme API",
      env: { NODE_ENV: "development" },
      envChecks: [
        envCheck({ name: "DATABASE_URL", value: "", ok: false, required: true }),
      ],
    })
    expect(checks[0]?.ok).toBe(false)
  })

  it("continues when required-not-critical checks fail under failHard", async () => {
    const checks = await runPreflight({
      product: "Acme API",
      env: { NODE_ENV: "production" },
      failHard: true,
      skipConnectivity: false,
      envChecks: [
        envCheck({
          name: "STRIPE_WEBHOOK_SECRET",
          value: "",
          ok: false,
          required: true,
          critical: false,
        }),
      ],
      probes: [
        {
          name: "stripe",
          required: true,
          critical: false,
          run: async () => ({ ok: false, detail: "Stripe API unreachable (1ms): down" }),
        },
      ],
    })
    expect(checks.every((check) => !check.ok)).toBe(true)
  })

  it("honors skipConnectivity even outside test", async () => {
    const run = vi.fn(async () => ({ ok: true, detail: "should not run" }))
    const checks = await runPreflight({
      product: "Acme API",
      env: { NODE_ENV: "development" },
      skipConnectivity: true,
      probes: [{ name: "postgres", required: true, run }],
    })
    expect(run).not.toHaveBeenCalled()
    expect(checks).toEqual([])
  })
})
