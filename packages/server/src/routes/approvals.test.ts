import { createSlimActionPolicy } from "@limetry/sdk"
import request from "supertest"
import { describe, expect, it } from "vitest"

import { createApp } from "../create-app.js"
import type { ServerEnv } from "../env.js"
import { InMemoryApprovalStore } from "../services/approval-store.js"
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

describe("approval required workflow", () => {
  it("creates a pending approval and binds payload hash on approve", async () => {
    const policyRegistry = new InMemoryPolicyRegistry()
    const approvalStore = new InMemoryApprovalStore()
    const auditStore = new InMemoryAuditStore()
    const policy = createSlimActionPolicy({
      agentId: "agent_demo",
      allowedActionTypes: ["deploy"],
      requireApprovalActionTypes: ["deploy"],
      policyId: "11111111-1111-4111-8111-111111111111",
    })
    policyRegistry.registerPolicy("default", policy)

    const app = createApp({
      env: baseEnv,
      policyRegistry,
      approvalStore,
      auditStore,
    })

    const intent = {
      intent_id: "22222222-2222-4222-8222-222222222222",
      policy_id: policy.policy_id,
      agent_id: "agent_demo",
      action_type: "deploy",
      resource: "acme/app@deadbeef",
      issued_at: new Date().toISOString(),
    }

    const evaluate = await request(app)
      .post("/v1/policy/evaluate")
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({
        tenant_id: "default",
        policy_id: policy.policy_id,
        intent,
      })

    expect(evaluate.status).toBe(200)
    expect(evaluate.body.decision).toBe("approval_required")
    expect(evaluate.body.approval_id).toBeTruthy()

    const list = await request(app)
      .get("/v1/approvals?status=pending")
      .set("Authorization", `Bearer ${bearerToken}`)
    expect(list.status).toBe(200)
    expect(list.body.approvals).toHaveLength(1)

    const mismatch = await request(app)
      .post(`/v1/approvals/${evaluate.body.approval_id}/approve`)
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({
        reviewer: "alice",
        intent: { ...intent, resource: "tampered" },
      })
    expect(mismatch.status).toBe(409)
    expect(mismatch.body.code).toBe("payload_mismatch")

    const approve = await request(app)
      .post(`/v1/approvals/${evaluate.body.approval_id}/approve`)
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({
        reviewer: "alice",
        intent,
      })
    expect(approve.status).toBe(200)
    expect(approve.body.approval.status).toBe("approved")
    expect(approve.body.approval.reviewer).toBe("alice")
  })

  it("denies a pending approval", async () => {
    const policyRegistry = new InMemoryPolicyRegistry()
    const approvalStore = new InMemoryApprovalStore()
    const policy = createSlimActionPolicy({
      agentId: "agent_demo",
      allowedActionTypes: ["sql.write"],
      requireApprovalActionTypes: ["sql.write"],
      policyId: "33333333-3333-4333-8333-333333333333",
    })
    policyRegistry.registerPolicy("default", policy)

    const app = createApp({
      env: baseEnv,
      policyRegistry,
      approvalStore,
    })

    const evaluate = await request(app)
      .post("/v1/policy/evaluate")
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({
        tenant_id: "default",
        policy_id: policy.policy_id,
        intent: {
          intent_id: "44444444-4444-4444-8444-444444444444",
          policy_id: policy.policy_id,
          agent_id: "agent_demo",
          action_type: "sql.write",
          resource: "postgres://*",
          issued_at: new Date().toISOString(),
        },
      })

    const deny = await request(app)
      .post(`/v1/approvals/${evaluate.body.approval_id}/deny`)
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({ reviewer: "bob" })

    expect(deny.status).toBe(200)
    expect(deny.body.approval.status).toBe("denied")
  })
})
