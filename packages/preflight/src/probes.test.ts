import { afterEach, describe, expect, it, vi } from "vitest"

import { createHttpProbe, probeHttp, probeReachableOrigin } from "./probes/http.js"
import { createPosthogProbe } from "./probes/posthog.js"
import { createSentryProbe, parseSentryDsn } from "./probes/sentry.js"
import { collectConfiguredTelemetry } from "./probes/telemetry.js"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("HTTP probes", () => {
  it("reports success and HTTP failures", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: false, status: 503 }))
    await expect(probeHttp({
      url: "https://example.com/health",
      success: "API reachable",
      failure: "API unreachable",
    })).resolves.toMatchObject({ ok: true })
    await expect(probeHttp({
      url: "https://example.com/health",
      success: "API reachable",
      failure: "API unreachable",
    })).resolves.toMatchObject({
      ok: false,
      detail: expect.stringContaining("HTTP 503"),
    })
  })

  it("treats network errors as failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED")))
    const result = await probeReachableOrigin({
      url: "https://example.com",
      success: "up",
      failure: "down",
    })
    expect(result.ok).toBe(false)
    expect(result.detail).toContain("connect ECONNREFUSED")
  })

  it("treats 4xx as reachable for origin probes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }))
    await expect(probeReachableOrigin({
      url: "https://sentry.io/api/0/",
      success: "Sentry reachable",
      failure: "Sentry unreachable",
    })).resolves.toMatchObject({ ok: true })
  })

  it("builds a named HTTP probe", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }))
    const probe = createHttpProbe({
      name: "clerk",
      url: "https://api.clerk.com/v1/instance",
      success: "Clerk API reachable",
      failure: "Clerk API unreachable",
      required: true,
      headers: { Authorization: "Bearer test" },
    })
    expect(probe.name).toBe("clerk")
    expect(probe.required).toBe(true)
    await expect(probe.run()).resolves.toMatchObject({ ok: true })
  })
})

describe("Sentry and PostHog", () => {
  it("probes Sentry envelope and PostHog decide when configured", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: true, status: 200 }))
    const sentry = createSentryProbe({ dsn: "https://abc123@o1.ingest.sentry.io/99" })
    expect(sentry?.required).toBe(false)
    await expect(sentry?.run()).resolves.toMatchObject({ ok: true })
    const posthog = createPosthogProbe({
      apiKey: "phc_example",
      host: "https://us.i.posthog.com",
    })
    await expect(posthog.run()).resolves.toMatchObject({ ok: true })
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe(
      "https://o1.ingest.sentry.io/api/99/envelope/",
    )
    expect(vi.mocked(fetch).mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      body: "{}\n",
      headers: expect.objectContaining({
        "X-Sentry-Auth": expect.stringContaining("sentry_key=abc123"),
      }),
    })
    expect(vi.mocked(fetch).mock.calls[1]?.[0]).toBe(
      "https://us.i.posthog.com/decide/?v=3",
    )
  })

  it("treats Sentry envelope 400 as reachable without requiring an org API token", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 400 }))
    const sentry = createSentryProbe({ dsn: "https://abc123@o1.ingest.sentry.io/99" })
    await expect(sentry?.run()).resolves.toMatchObject({ ok: true })
  })

  it("fails Sentry and PostHog probes on HTTP 404", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    const sentry = createSentryProbe({ dsn: "https://abc123@o1.ingest.sentry.io/99" })
    await expect(sentry?.run()).resolves.toMatchObject({
      ok: false,
      detail: expect.stringContaining("HTTP 404"),
    })
    const posthog = createPosthogProbe({ apiKey: "phc_example" })
    await expect(posthog.run()).resolves.toMatchObject({
      ok: false,
      detail: expect.stringContaining("HTTP 404"),
    })
  })

  it("parses DSNs and skips invalid ones", () => {
    expect(parseSentryDsn("https://abc123@o1.ingest.sentry.io/99")).toEqual({
      origin: "https://o1.ingest.sentry.io",
      projectId: "99",
      publicKey: "abc123",
    })
    expect(parseSentryDsn("not-a-dsn")).toBeNull()
    expect(createSentryProbe({ dsn: "invalid" })).toBeNull()
  })

  it("collects telemetry only when keys are configured", () => {
    expect(collectConfiguredTelemetry({}).probes).toEqual([])
    const bundle = collectConfiguredTelemetry({
      SENTRY_DSN: "https://abc123@o1.ingest.sentry.io/99",
      POSTHOG_KEY: "phc_example",
      POSTHOG_HOST: "https://eu.i.posthog.com",
    })
    expect(bundle.envChecks.map((check) => check.name)).toEqual(["SENTRY_DSN", "POSTHOG_KEY"])
    expect(bundle.probes.map((probe) => probe.name)).toEqual(["sentry", "posthog"])
    expect(bundle.configuration.some((line) => line.startsWith("POSTHOG_HOST:"))).toBe(true)
    expect(bundle.envChecks.every((check) => check.required === false)).toBe(true)
  })

  it("warns on an invalid Sentry DSN without adding a probe", () => {
    const bundle = collectConfiguredTelemetry({ SENTRY_DSN: "not-a-dsn" })
    expect(bundle.envChecks[0]).toMatchObject({ name: "SENTRY_DSN", ok: false, required: false })
    expect(bundle.probes).toEqual([])
  })
})
