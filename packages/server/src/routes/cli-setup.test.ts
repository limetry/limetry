import request from "supertest"
import { describe, expect, it } from "vitest"

import { createApp } from "../create-app.js"
import { loadEnv } from "../env.js"

describe("local CLI setup", () => {
  const env = loadEnv({
    NODE_ENV: "test",
    LIMETRY_BEARER_TOKEN: "test-bearer-token-at-least-16",
    JWT_SECRET: "your-jwt-secret-change-in-production",
  })

  it("rejects a bearer token that does not match and accepts the server token", async () => {
    const app = createApp({ env })
    const rejected = await request(app)
      .get("/v1/rules")
      .set("Authorization", "Bearer not-the-server-token")
    expect(rejected.status).toBe(401)

    const accepted = await request(app)
      .get("/v1/rules")
      .set("Authorization", `Bearer ${env.LIMETRY_BEARER_TOKEN}`)
    expect(accepted.status).toBe(200)
  })

  it("mints a loopback CLI token after the confirm form", async () => {
    const app = createApp({ env })
    const page = await request(app).get("/cli/setup").query({
      redirect_uri: "http://127.0.0.1:9/oauth/callback",
      state: "state-1",
    })
    expect(page.status).toBe(200)
    expect(page.text).toContain("Create CLI token")

    const created = await request(app)
      .post("/v1/setup/cli-token")
      .type("form")
      .send({ redirect_uri: "http://127.0.0.1:9/oauth/callback", state: "state-1" })
    expect(created.status).toBe(303)
    const location = new URL(created.headers.location ?? "")
    const code = location.searchParams.get("code") ?? ""
    expect(code.length).toBeGreaterThan(10)

    const exchanged = await request(app)
      .post("/v1/setup/cli-token/exchange")
      .send({ code })
    expect(exchanged.status).toBe(200)
    const token = exchanged.body.token as string
    const authed = await request(app)
      .get("/v1/rules")
      .set("Authorization", `Bearer ${token}`)
    expect(authed.status).toBe(200)
  })
})
