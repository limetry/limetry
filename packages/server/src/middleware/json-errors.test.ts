import request from "supertest"
import { describe, expect, it } from "vitest"

import { createApp } from "../create-app.js"
import type { ServerEnv } from "../env.js"

const baseEnv: ServerEnv = {
  LIMETRY_API_PORT: 3810,
  LIMETRY_BEARER_TOKEN: "test-bearer-token-123456",
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

/** Verifies JSON API error responses. */
describe("json API errors", () => {
  /** Verifies malformed JSON returns ApiError instead of HTML. */
  it("returns invalid_json for malformed policy bodies", async () => {
    const app = createApp({ env: baseEnv })
    const response = await request(app)
      .put("/v1/policies/550e8400-e29b-41d4-a716-446655440000")
      .set("Authorization", `Bearer ${baseEnv.LIMETRY_BEARER_TOKEN}`)
      .set("Content-Type", "application/json")
      .send("{ not-json")

    expect(response.status).toBe(400)
    expect(response.headers["content-type"]).toMatch(/json/)
    expect(response.body).toEqual({
      error: "invalid_json",
      message: "Request body must be valid JSON",
    })
    expect(response.text).not.toContain("<!DOCTYPE html>")
  })

  /** Verifies unknown API paths return JSON not_found. */
  it("returns not_found JSON for unknown v1 routes", async () => {
    const app = createApp({ env: baseEnv })
    const response = await request(app).get("/v1/unknown-route")

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ error: "not_found" })
  })
})
