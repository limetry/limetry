import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { clearCorpusCache, loadAssistantEnv } from "@limetry/assistant"
import type { FastifyInstance } from "fastify"
import { afterEach, describe, expect, it, vi } from "vitest"

import { createApiApp } from "./create-app.js"
import * as turnstileVerify from "./turnstile/verify.js"

const corpusPath = resolve(
  fileURLToPath(new URL("./fixtures/minimal-corpus.json", import.meta.url)),
)

function testEnv(overrides: Record<string, string | boolean | number> = {}) {
  return loadAssistantEnv({
    LIMETRY_ASSISTANT_BACKEND: "memory",
    LIMETRY_ASSISTANT_CORPUS_PATH: corpusPath,
    LIMETRY_ASSISTANT_PUBLIC: "true",
    ...Object.fromEntries(
      Object.entries(overrides).map(([key, value]) => [key, String(value)]),
    ),
  })
}

const apps: FastifyInstance[] = []

async function buildApp(
  overrides: Record<string, string | boolean | number> = {},
): Promise<FastifyInstance> {
  clearCorpusCache()
  const app = await createApiApp(testEnv(overrides))
  await app.ready()
  apps.push(app)
  return app
}

afterEach(async () => {
  while (apps.length > 0) {
    const app = apps.pop()
    if (app) {
      await app.close()
    }
  }
})

describe("Ask Limetry chat routes", () => {
  it("answers publicly from the memory corpus with citations", async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: "POST",
      url: "/api/assistant",
      payload: { message: "How do I self-host Limetry?" },
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.ok).toBe(true)
    expect(body.backend).toBe("memory")
    expect(body.answer).toBeTruthy()
    expect(body.answer).not.toMatch(/Based on Limetry docs related to/)
    expect(Array.isArray(body.sources)).toBe(true)
    expect(body.sources.length).toBeGreaterThan(0)
    expect(body.sources[0].sourcePath).toBeTruthy()
    expect(body.sources[0].href).toBeTruthy()
  })

  it("streams SSE meta, delta, and done events", async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: "POST",
      url: "/api/assistant/stream",
      payload: { message: "What is data minimization?" },
    })

    expect(response.statusCode).toBe(200)
    expect(String(response.headers["content-type"])).toMatch(/text\/event-stream/)
    const body = response.body
    expect(body).toContain("\"type\":\"meta\"")
    expect(body).toContain("\"type\":\"delta\"")
    expect(body).toContain("\"type\":\"done\"")
  })

  it("rejects empty messages", async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: "POST",
      url: "/api/assistant",
      payload: { message: "" },
    })
    expect(response.statusCode).toBe(400)
  })

  it("serves OpenAPI JSON and redirects legacy docs paths", async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: "GET",
      url: "/api/assistant/openapi.json",
    })
    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.openapi).toMatch(/^3\./)
    expect(body.paths["/api/assistant"]).toBeTruthy()
    expect(body.paths["/api/contact"]).toBeTruthy()
    expect(body.paths["/api/health"]).toBeTruthy()

    const legacyJson = await app.inject({
      method: "GET",
      url: "/api/assistant/docs/json",
    })
    expect(legacyJson.statusCode).toBe(302)
    expect(legacyJson.headers.location).toBe("/api/assistant/openapi.json")

    const legacyUi = await app.inject({
      method: "GET",
      url: "/api/assistant/docs",
    })
    expect(legacyUi.statusCode).toBe(302)
    expect(legacyUi.headers.location).toBe("/openapi/assistant/")
  })

  it("returns 405 JSON for GET on POST-only chat routes", async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: "GET",
      url: "/api/assistant",
      headers: { accept: "application/json" },
    })
    expect(response.statusCode).toBe(405)
    expect(response.json().error).toBe("method_not_allowed")
  })

  it("serves /api/health for same-origin CloudFront checks", async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: "GET",
      url: "/api/health",
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().ok).toBe(true)
    expect(response.json().service).toBe("ask-limetry")
  })

  it("requires bearer auth when LIMETRY_ASSISTANT_PUBLIC is false", async () => {
    const app = await buildApp({
      LIMETRY_ASSISTANT_PUBLIC: "false",
      LIMETRY_ASSISTANT_BEARER_TOKEN: "test-secret",
    })
    const denied = await app.inject({
      method: "POST",
      url: "/api/assistant",
      payload: { message: "How do I self-host Limetry?" },
    })
    expect(denied.statusCode).toBe(401)
    expect(denied.json().error).toBe("assistant_auth_required")

    const allowed = await app.inject({
      method: "POST",
      url: "/api/assistant",
      headers: { authorization: "Bearer test-secret" },
      payload: { message: "How do I self-host Limetry?" },
    })
    expect(allowed.statusCode).toBe(200)
    expect(allowed.json().ok).toBe(true)
  })
})

describe("contact routes", () => {
  it("returns 412 when Brevo is not configured", async () => {
    const previous = {
      CONTACT_PROVIDER: process.env.CONTACT_PROVIDER,
      CONTACT_API_KEY: process.env.CONTACT_API_KEY,
    }
    delete process.env.CONTACT_PROVIDER
    delete process.env.CONTACT_API_KEY
    const verifySpy = vi.spyOn(turnstileVerify, "verifyTurnstileToken").mockResolvedValue({
      ok: true,
    })
    try {
      const app = await buildApp()
      const response = await app.inject({
        method: "POST",
        url: "/api/contact",
        payload: {
          name: "Ada Lovelace",
          email: "ada@example.com",
          message: "Hello from the analytical engine era.",
          turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
        },
      })
      expect(response.statusCode).toBe(412)
      expect(response.json().error).toMatch(/not configured/i)
    } finally {
      verifySpy.mockRestore()
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) {
          delete process.env[key]
        } else {
          process.env[key] = value
        }
      }
    }
  })

  it("returns 405 JSON for GET /api/contact", async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: "GET",
      url: "/api/contact",
      headers: { accept: "application/json" },
    })
    expect(response.statusCode).toBe(405)
    expect(response.headers.allow).toBe("POST")
    expect(response.json().error).toBe("method_not_allowed")
  })
})
