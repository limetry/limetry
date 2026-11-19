import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

import type { FastifyInstance } from "fastify"
import { afterEach, describe, expect, it } from "vitest"

import { clearCorpusCache } from "./corpus.js"
import { createAssistantApp } from "./create-app.js"
import { loadAssistantEnv } from "./env.js"

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
  const app = await createAssistantApp(testEnv(overrides))
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

  it("serves OpenAPI JSON", async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: "GET",
      url: "/api/assistant/docs/json",
    })
    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.openapi).toMatch(/^3\./)
    expect(body.paths["/api/assistant"]).toBeTruthy()
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
