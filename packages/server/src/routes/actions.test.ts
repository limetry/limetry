import { createSlimActionPolicy } from "@limetry/sdk"
import request from "supertest"
import { describe, expect, it } from "vitest"

import { createApp } from "../create-app.js"
import type { ServerEnv } from "../env.js"
import { InMemoryAuditStore } from "../services/audit-store.js"
import { InMemoryPolicyRegistry } from "../services/policy-registry.js"

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

describe("action governance routes", () => {
  it("denies disallowed action intents and writes audit events", async () => {
    const policyRegistry = new InMemoryPolicyRegistry()
    const auditStore = new InMemoryAuditStore()
    const policy = createSlimActionPolicy({
      agentId: "agent_demo",
      allowedActionTypes: ["http_get"],
      deniedActionTypes: ["http_post"],
      policyId: "11111111-1111-4111-8111-111111111111",
    })
    policyRegistry.registerPolicy("default", policy)

    const app = createApp({
      env: baseEnv,
      policyRegistry,
      auditStore,
    })

    const evaluate = await request(app)
      .post("/v1/policy/evaluate")
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({
        tenant_id: "default",
        policy_id: policy.policy_id,
        intent: {
          intent_id: "22222222-2222-4222-8222-222222222222",
          policy_id: policy.policy_id,
          agent_id: "agent_demo",
          action_type: "http_post",
          resource: "https://prod.example.com/run",
          issued_at: new Date().toISOString(),
        },
      })

    expect(evaluate.status).toBe(200)
    expect(evaluate.body.ok).toBe(true)
    expect(evaluate.body.approved).toBe(false)
    expect(evaluate.body.receipt.decision).toBe("deny")
    expect(evaluate.body.receipt.sig).toHaveLength(64)

    const audit = await request(app)
      .get("/v1/audit?event_type=policy.evaluated")
      .set("Authorization", `Bearer ${bearerToken}`)

    expect(audit.status).toBe(200)
    expect(audit.body.events).toHaveLength(1)
    expect(audit.body.events[0].event_type).toBe("policy.evaluated")
  })

  it("records executed actions and lists them in audit", async () => {
    const auditStore = new InMemoryAuditStore()
    const app = createApp({ env: baseEnv, auditStore })

    const record = await request(app)
      .post("/v1/actions/record")
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({
        intent: {
          intent_id: "44444444-4444-4444-8444-444444444444",
          policy_id: "11111111-1111-4111-8111-111111111111",
          agent_id: "agent_demo",
          action_type: "http_get",
          resource: "https://prod.example.com/status",
          issued_at: new Date().toISOString(),
        },
        outcome: "executed",
      })

    expect(record.status).toBe(201)
    expect(record.body.ok).toBe(true)

    const audit = await request(app)
      .get("/v1/audit?event_type=action.recorded")
      .set("Authorization", `Bearer ${bearerToken}`)

    expect(audit.status).toBe(200)
    expect(audit.body.events).toHaveLength(1)
    expect(audit.body.events[0].details.outcome).toBe("executed")
  })

  it("scrubs secrets from audit storage under minimal audit_mode", async () => {
    const policyRegistry = new InMemoryPolicyRegistry()
    const auditStore = new InMemoryAuditStore()
    const policy = createSlimActionPolicy({
      agentId: "agent_demo",
      allowedActionTypes: ["http_post"],
      policyId: "11111111-1111-4111-8111-111111111111",
      auditMode: "minimal",
    })
    policyRegistry.registerPolicy("default", policy)

    const app = createApp({
      env: baseEnv,
      policyRegistry,
      auditStore,
    })

    const evaluate = await request(app)
      .post("/v1/policy/evaluate")
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({
        policy_id: policy.policy_id,
        intent: {
          intent_id: "66666666-6666-4666-8666-666666666666",
          policy_id: policy.policy_id,
          agent_id: "agent_demo",
          action_type: "http_post",
          resource: "https://api.example.com/deploy?token=super-secret",
          metadata: { api_key: "sk-live-leak", note: "safe" },
          issued_at: new Date().toISOString(),
        },
      })

    expect(evaluate.status).toBe(200)

    const record = await request(app)
      .post("/v1/actions/record")
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({
        intent: {
          intent_id: "66666666-6666-4666-8666-666666666666",
          policy_id: policy.policy_id,
          agent_id: "agent_demo",
          action_type: "http_post",
          resource: "https://api.example.com/deploy?token=super-secret",
          issued_at: new Date().toISOString(),
        },
        outcome: "blocked",
        details: { Authorization: "Bearer leak", path: "/ok" },
      })

    expect(record.status).toBe(201)

    const events = await auditStore.list("default", { limit: 20 })
    const serialized = JSON.stringify(events.events)
    expect(serialized).not.toContain("super-secret")
    expect(serialized).not.toContain("sk-live-leak")
    expect(serialized).not.toContain("Bearer leak")
    expect(serialized).toContain("https://api.example.com/deploy")
    expect(events.events.some((event) => event.details.audit_mode === "minimal")).toBe(true)
    const recorded = events.events.find((event) => event.event_type === "action.recorded")
    expect(recorded?.details.details).toBeUndefined()
  })

  it("allows action intents that satisfy the policy", async () => {
    const policyRegistry = new InMemoryPolicyRegistry()
    const policy = createSlimActionPolicy({
      agentId: "agent_demo",
      allowedActionTypes: ["http_get"],
      allowedResourcePatterns: ["https://prod.example.com/*"],
      policyId: "11111111-1111-4111-8111-111111111111",
    })
    policyRegistry.registerPolicy("default", policy)

    const app = createApp({ env: baseEnv, policyRegistry })

    const evaluate = await request(app)
      .post("/v1/policy/evaluate")
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({
        policy_id: policy.policy_id,
        intent: {
          intent_id: "55555555-5555-4555-8555-555555555555",
          policy_id: policy.policy_id,
          agent_id: "agent_demo",
          action_type: "http_get",
          resource: "https://prod.example.com/health",
          issued_at: new Date().toISOString(),
        },
      })

    expect(evaluate.status).toBe(200)
    expect(evaluate.body.approved).toBe(true)
    expect(evaluate.body.receipt.decision).toBe("allow")
  })
})
