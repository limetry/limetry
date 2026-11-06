import request from "supertest"
import { describe, expect, it } from "vitest"

import { createApp } from "../create-app.js"
import { testServerEnv } from "../test-env.js"

const baseEnv = testServerEnv()

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
