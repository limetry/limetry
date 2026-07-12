import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { CANONICAL_ORIGINS, resolveWebOrigins } from "./public-origins"

describe("web public origins", () => {
  it("keeps localhost defaults for local development", () => {
    const origins = resolveWebOrigins({ NODE_ENV: "development" })
    assert.equal(origins.web.url, "http://localhost:3800")
    assert.equal(origins.web.source, "default")
    assert.equal(origins.app.url, "http://localhost:3830")
    assert.equal(origins.api.url, "http://localhost:3810")
  })

  it("uses Vercel self URL for the marketing site and canonical product URLs", () => {
    const origins = resolveWebOrigins({
      NODE_ENV: "production",
      VERCEL: "1",
      VERCEL_ENV: "production",
      VERCEL_PROJECT_PRODUCTION_URL: "limetry.org",
    })
    assert.equal(origins.web.url, "https://limetry.org")
    assert.equal(origins.web.source, "vercel")
    assert.equal(origins.app.url, CANONICAL_ORIGINS.app)
    assert.equal(origins.app.source, "canonical")
    assert.equal(origins.api.url, CANONICAL_ORIGINS.ossApi)
    assert.equal(origins.api.source, "canonical")
  })

  it("lets an explicit env override win", () => {
    const origins = resolveWebOrigins({
      VERCEL: "1",
      NEXT_PUBLIC_APP_URL: "https://staging.app.example.com",
    })
    assert.equal(origins.app.url, "https://staging.app.example.com")
    assert.equal(origins.app.source, "env")
  })
})
