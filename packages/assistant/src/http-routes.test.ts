import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

import request from "supertest"
import { describe, expect, it } from "vitest"

import { createAssistantApp } from "./create-app.js"
import { clearCorpusCache } from "./corpus.js"
import { loadAssistantEnv } from "./env.js"

const corpusPath = resolve(
  fileURLToPath(new URL("./fixtures/minimal-corpus.json", import.meta.url)),
)

function testEnv(overrides: Record<string, string | boolean | number> = {}) {
  return loadAssistantEnv({
    LIMETRY_ASSISTANT_BACKEND: "memory",
    LIMETRY_ASSISTANT_CORPUS_PATH: corpusPath,
    LIMETRY_ASSISTANT_PUBLIC: "true",
    LIMETRY_ASSISTANT_CORS_ORIGINS: "https://limetry.org",
    ...Object.fromEntries(
      Object.entries(overrides).map(([key, value]) => [key, String(value)]),
    ),
  })
}

describe("Ask Limetry chat routes", () => {
  it("answers publicly from the memory corpus with citations", async () => {
    clearCorpusCache()
    const app = createAssistantApp(testEnv())
    const response = await request(app)
      .post("/api/chat")
      .send({ message: "How do I self-host Limetry?" })

    expect(response.status).toBe(200)
    expect(response.body.ok).toBe(true)
    expect(response.body.backend).toBe("memory")
    expect(response.body.answer).toBeTruthy()
    expect(response.body.answer).not.toMatch(/Based on Limetry docs related to/)
    expect(Array.isArray(response.body.sources)).toBe(true)
    expect(response.body.sources.length).toBeGreaterThan(0)
    expect(response.body.sources[0].sourcePath).toBeTruthy()
    expect(response.body.sources[0].href).toBeTruthy()
  })

  it("streams SSE meta, delta, and done events", async () => {
    clearCorpusCache()
    const app = createAssistantApp(testEnv())
    const response = await request(app)
      .post("/api/chat/stream")
      .send({ message: "What is data minimization?" })
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = []
        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)))
        res.on("end", () => {
          callback(null, Buffer.concat(chunks).toString("utf8"))
        })
      })

    expect(response.status).toBe(200)
    expect(String(response.headers["content-type"])).toMatch(/text\/event-stream/)
    const body = String(response.body)
    expect(body).toContain("\"type\":\"meta\"")
    expect(body).toContain("\"type\":\"delta\"")
    expect(body).toContain("\"type\":\"done\"")
  })

  it("rejects empty messages", async () => {
    const app = createAssistantApp(testEnv())
    const response = await request(app).post("/api/chat").send({ message: "" })
    expect(response.status).toBe(400)
    expect(response.body.error).toBe("invalid_chat_request")
  })

  it("allows www and apex landing origins on OPTIONS preflight", async () => {
    const app = createAssistantApp(testEnv({
      LIMETRY_ASSISTANT_CORS_ORIGINS: "https://limetry.org",
    }))
    for (const origin of ["https://limetry.org", "https://www.limetry.org"]) {
      const response = await request(app)
        .options("/api/chat")
        .set("Origin", origin)
        .set("Access-Control-Request-Method", "POST")
        .set("Access-Control-Request-Headers", "content-type")
      expect(response.status, origin).toBe(204)
      expect(response.headers["access-control-allow-origin"]).toBe(origin)
    }
  })

  it("denies unknown Origins on OPTIONS preflight", async () => {
    const app = createAssistantApp(testEnv())
    const response = await request(app)
      .options("/api/chat")
      .set("Origin", "https://evil.example")
      .set("Access-Control-Request-Method", "POST")
    expect(response.status).toBe(403)
  })
})
