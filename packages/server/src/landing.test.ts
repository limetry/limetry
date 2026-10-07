import { join } from "node:path"
import { fileURLToPath } from "node:url"

import { APP_VERSION } from "@limetry/sdk"
import request from "supertest"
import { describe, expect, it } from "vitest"

import { createApp, resolvePublicDir } from "./create-app.js"
import type { ServerEnv } from "./env.js"

const bearerToken = "test-bearer-token-123456"

const baseEnv: ServerEnv = {
  LIMETRY_API_PORT: 3810,
  LIMETRY_BEARER_TOKEN: bearerToken,
  DATABASE_URL: "postgresql://localhost:5432/limetry",
  JWT_SECRET: "test-jwt-secret-at-least-32-characters",
  REPLAY_WINDOW_MS: 300_000,
  THROTTLE_MAX_REQUESTS_PER_MINUTE: 50,
  USE_POSTGRES_STORE: false,
  LIMETRY_DEFAULT_AUDIT_MODE: "minimal",
  LIMETRY_AUDIT_RETENTION_DAYS: 90,
  LIMETRY_AUDIT_PURGE_INTERVAL_MS: 3_600_000,
  DECISION_HMAC_SECRET: "test-decision-hmac-secret-at-least-32-chars",
}

describe("landing page", () => {
  it("resolves the packaged public directory", () => {
    const publicDir = resolvePublicDir()
    expect(publicDir).toBeTruthy()
    expect(publicDir?.endsWith("public")).toBe(true)
  })

  it("serves an HTML landing page at GET /", async () => {
    const publicDir = join(fileURLToPath(new URL("..", import.meta.url)), "public")
    const previousWebUrl = process.env.NEXT_PUBLIC_WEB_URL
    process.env.NEXT_PUBLIC_WEB_URL = "https://dev.limetry.org"
    try {
      const app = createApp({ env: baseEnv, publicDir })

      const response = await request(app).get("/")

      expect(response.status).toBe(200)
      expect(response.headers["content-type"]).toMatch(/html/)
      expect(response.text).toContain("Limetry Central")
      expect(response.text).toContain("/v1/policy/evaluate")
      expect(response.text).toContain("Available paths")
      expect(response.text).toContain(`v${APP_VERSION}`)
      expect(response.text).not.toContain("__APP_VERSION__")
      expect(response.text).not.toContain("__WEB_ORIGIN__")
      expect(response.text).toContain("https://dev.limetry.org/docs/quick-start")
      expect(response.text).toContain("Agent action governance — evaluate, allow, deny, and audit tool calls before they land.")
      expect(response.text).toContain("© ")
      expect(response.text).not.toContain("__YEAR__")
      expect(response.text).not.toContain("__APP_ORIGIN__")
      expect(response.text).not.toContain("Try Limetry Cloud")
      expect(response.text).not.toContain(">Limetry Cloud<")
      expect(response.text).not.toContain("https://limetry.com/docs/quick-start")
    } finally {
      if (previousWebUrl === undefined) {
        delete process.env.NEXT_PUBLIC_WEB_URL
      } else {
        process.env.NEXT_PUBLIC_WEB_URL = previousWebUrl
      }
    }
  })

  it("still serves health JSON after mounting the landing page", async () => {
    const app = createApp({ env: baseEnv })
    const response = await request(app).get("/health")
    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      ok: true,
      service: "limetry-server",
      version: APP_VERSION,
    })
  })

  it("serves OpenAPI YAML, JSON, and Swagger UI", async () => {
    const publicDir = join(fileURLToPath(new URL("..", import.meta.url)), "public")
    const app = createApp({ env: baseEnv, publicDir })

    const yaml = await request(app).get("/openapi.yaml")
    expect(yaml.status).toBe(200)
    expect(yaml.text).toMatch(/openapi:\s*['"]?3\./)

    const json = await request(app).get("/openapi.json")
    expect(json.status).toBe(200)
    expect(json.body.openapi).toMatch(/^3\./)

    const swagger = await request(app).get("/openapi")
    expect(swagger.status).toBe(200)
    expect(swagger.text).toContain("swagger-ui")
    expect(swagger.text).toContain("/openapi.yaml")

    const versionedYaml = await request(app).get("/v1/openapi.yaml")
    expect(versionedYaml.status).toBe(200)
    expect(versionedYaml.text).toMatch(/openapi:\s*['"]?3\./)

    const versionedJson = await request(app).get("/v1/openapi.json")
    expect(versionedJson.status).toBe(200)
    expect(versionedJson.body.openapi).toMatch(/^3\./)

    const versionedSwagger = await request(app).get("/v1/docs")
    expect(versionedSwagger.status).toBe(200)
    expect(versionedSwagger.text).toContain("swagger-ui")
    expect(versionedSwagger.text).toContain("/v1/openapi.yaml")
  })
})
