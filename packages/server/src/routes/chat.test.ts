import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

import request from "supertest"
import { describe, expect, it } from "vitest"

import { createApp } from "../create-app.js"
import { clearCorpusCache } from "../services/rag/corpus.js"
import { testServerEnv } from "../test-env.js"

const corpusPath = resolve(
  fileURLToPath(new URL("../services/rag/fixtures/minimal-corpus.json", import.meta.url)),
)

describe("docs RAG chat route", () => {
  it("answers publicly from the memory corpus with citations", async () => {
    clearCorpusCache()
    const env = testServerEnv({
      LIMETRY_RAG_BACKEND: "memory",
      LIMETRY_RAG_CORPUS_PATH: corpusPath,
      LIMETRY_RAG_CHAT_PUBLIC: true,
    })
    const app = createApp({ env })
    const response = await request(app)
      .post("/v1/chat")
      .send({ message: "How do I self-host Limetry?" })

    expect(response.status).toBe(200)
    expect(response.body.ok).toBe(true)
    expect(response.body.backend).toBe("memory")
    expect(response.body.answer).toBeTruthy()
    expect(Array.isArray(response.body.sources)).toBe(true)
    expect(response.body.sources.length).toBeGreaterThan(0)
    expect(response.body.sources[0].sourcePath).toBeTruthy()
  })

  it("rejects empty messages", async () => {
    const app = createApp({ env: testServerEnv({ LIMETRY_RAG_CHAT_PUBLIC: true }) })
    const response = await request(app).post("/v1/chat").send({ message: "" })
    expect(response.status).toBe(400)
    expect(response.body.error).toBe("invalid_chat_request")
  })

  it("allows www and apex landing origins on OPTIONS preflight", async () => {
    const previousWebUrl = process.env.NEXT_PUBLIC_WEB_URL
    process.env.NEXT_PUBLIC_WEB_URL = "https://limetry.org"
    try {
      const app = createApp({ env: testServerEnv({ LIMETRY_RAG_CHAT_PUBLIC: true }) })
      for (const origin of ["https://limetry.org", "https://www.limetry.org"]) {
        const response = await request(app)
          .options("/v1/chat")
          .set("Origin", origin)
          .set("Access-Control-Request-Method", "POST")
          .set("Access-Control-Request-Headers", "content-type")
        expect(response.status, origin).toBe(204)
        expect(response.headers["access-control-allow-origin"]).toBe(origin)
      }
    } finally {
      if (previousWebUrl === undefined) {
        delete process.env.NEXT_PUBLIC_WEB_URL
      } else {
        process.env.NEXT_PUBLIC_WEB_URL = previousWebUrl
      }
    }
  })

  it("denies unknown Origins on OPTIONS preflight", async () => {
    const previousWebUrl = process.env.NEXT_PUBLIC_WEB_URL
    process.env.NEXT_PUBLIC_WEB_URL = "https://limetry.org"
    try {
      const app = createApp({ env: testServerEnv({ LIMETRY_RAG_CHAT_PUBLIC: true }) })
      const response = await request(app)
        .options("/v1/chat")
        .set("Origin", "https://evil.example")
        .set("Access-Control-Request-Method", "POST")
      expect(response.status).toBe(403)
    } finally {
      if (previousWebUrl === undefined) {
        delete process.env.NEXT_PUBLIC_WEB_URL
      } else {
        process.env.NEXT_PUBLIC_WEB_URL = previousWebUrl
      }
    }
  })
})
