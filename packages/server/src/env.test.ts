import { describe, expect, it } from "vitest"

import { loadEnv } from "./env.js"

describe("server environment", () => {
  it("treats empty string optional variables as undefined", () => {
    const env = loadEnv({
      NODE_ENV: "development",
      LIMETRY_BEARER_TOKEN: "test-bearer-token-at-least-16",
      JWT_SECRET: "your-jwt-secret-change-in-production",
      REDIS_URL: "",
      DECISION_HMAC_SECRET: "",
    })

    expect(env.REDIS_URL).toBeUndefined()
    expect(env.DECISION_HMAC_SECRET).toBeUndefined()
  })

  it("parses valid REDIS_URL when provided", () => {
    const env = loadEnv({
      NODE_ENV: "development",
      LIMETRY_BEARER_TOKEN: "test-bearer-token-at-least-16",
      JWT_SECRET: "your-jwt-secret-change-in-production",
      REDIS_URL: "redis://localhost:6379",
    })

    expect(env.REDIS_URL).toBe("redis://localhost:6379")
  })

  it("rejects in-memory storage in production", () => {
    expect(() =>
      loadEnv({
        NODE_ENV: "production",
        LIMETRY_BEARER_TOKEN: "production-bearer-token-at-least-32-chars",
        JWT_SECRET: "production-jwt-secret-at-least-32-characters",
        DECISION_HMAC_SECRET: "production-decision-secret-at-least-32-chars",
        DATABASE_URL: "postgresql://limetry:limetry@db.example.com:5432/limetry",
        USE_POSTGRES_STORE: "false",
      }),
    ).toThrow("USE_POSTGRES_STORE=true is required in production")
  })

  it("requires a dedicated decision HMAC secret in production", () => {
    expect(() =>
      loadEnv({
        NODE_ENV: "production",
        LIMETRY_BEARER_TOKEN: "production-bearer-token-at-least-32-chars",
        JWT_SECRET: "production-jwt-secret-at-least-32-characters",
        DATABASE_URL: "postgresql://limetry:limetry@db.example.com:5432/limetry",
        USE_POSTGRES_STORE: "true",
      }),
    ).toThrow("DECISION_HMAC_SECRET must be set")
  })

  it("rejects loopback DATABASE_URL in production", () => {
    expect(() =>
      loadEnv({
        NODE_ENV: "production",
        LIMETRY_BEARER_TOKEN: "production-bearer-token-at-least-32-chars",
        JWT_SECRET: "production-jwt-secret-at-least-32-characters",
        DECISION_HMAC_SECRET: "production-decision-secret-at-least-32-chars",
        DATABASE_URL: "postgresql://postgres:password@localhost:5432/limetry",
        USE_POSTGRES_STORE: "true",
      }),
    ).toThrow("non-loopback Postgres")
  })
})
