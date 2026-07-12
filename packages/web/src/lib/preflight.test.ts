import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { loadWebEnv } from "./env"
import { collectWebEnvChecks, runWebPreflight } from "./preflight"

describe("Limetry web preflight", () => {
  it("reports public site URLs and emails without Clerk, Stripe, or API pings", async () => {
    const env = loadWebEnv({})
    const names = collectWebEnvChecks(env).map((check) => check.name)
    assert.deepEqual(names, [
      "NEXT_PUBLIC_WEB_URL",
      "NEXT_PUBLIC_APP_URL",
      "NEXT_PUBLIC_API_URL",
      "NEXT_PUBLIC_GITHUB_URL",
      "NEXT_PUBLIC_DISCORD_URL",
      "NEXT_PUBLIC_CONTACT_EMAIL",
      "NEXT_PUBLIC_LEGAL_EMAIL",
      "NEXT_PUBLIC_PRIVACY_EMAIL",
    ])
    assert.equal(names.includes("CLERK_SECRET_KEY"), false)
    assert.equal(names.includes("DATABASE_URL"), false)
    const checks = await runWebPreflight({ NODE_ENV: "test" })
    assert.equal(checks.some((check) => check.name === "enterprise_bff"), false)
    assert.equal(checks.some((check) => check.name === "oss_api"), false)
  })

  it("includes Sentry and PostHog env checks and probes when telemetry keys are set", async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () => ({
      ok: true,
      status: 200,
    })) as typeof fetch
    try {
      const checks = await runWebPreflight({
        NODE_ENV: "development",
        NEXT_PUBLIC_SENTRY_DSN: "https://abc123@o1.ingest.sentry.io/99",
        NEXT_PUBLIC_POSTHOG_KEY: "phc_example",
        NEXT_PUBLIC_POSTHOG_HOST: "https://us.i.posthog.com",
      })
      assert.equal(checks.some((check) => check.name === "SENTRY_DSN"), true)
      assert.equal(checks.some((check) => check.name === "POSTHOG_KEY"), true)
      assert.equal(checks.some((check) => check.name === "sentry" && check.ok), true)
      assert.equal(checks.some((check) => check.name === "posthog" && check.ok), true)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
