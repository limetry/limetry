import { describe, expect, it } from "vitest"

import { SqliteStore } from "./sqlite-store.js"

describe("SQLite self-host store", () => {
  it("persists users, tokens, policies, audit events, approvals, and state", async () => {
    const store = SqliteStore.open(":memory:")
    const user = store.userService.createUser(
      "engineer@example.com",
      "correct horse battery staple",
      "Engineer",
      "tenant_test",
      "ADMIN",
    )
    const token = store.userService.createAccessToken(
      user.id,
      user.tenantId,
      "local development",
      ["policy:evaluate"],
    )

    expect(store.userService.getAccessTokenByValue(token.plaintextToken)?.id).toBe(token.record.id)

    const policy = await store.policyRegistry.registerPolicy("tenant_test", {
      policy_id: "default",
      policy_type: "action",
      rules: [],
    })
    expect(store.policyRegistry.getPolicy("tenant_test", "default")?.policy.policy_id).toBe(
      policy.policy.policy_id,
    )

    const audit = await store.auditStore.append({
      tenant_id: "tenant_test",
      event_type: "policy.evaluated",
      subject_id: "decision_test",
      details: { decision: "allow" },
    })
    expect((await store.auditStore.list("tenant_test", {})).events[0]?.id).toBe(audit.id)

    const approval = await store.approvalStore.create({
      tenant_id: "tenant_test",
      decision_id: "decision_test",
      policy_id: "default",
      agent_id: "agent_test",
      action_type: "read",
      resource: "repo",
      payload_hash: "payload",
      intent: {
        action_type: "read",
        agent_id: "agent_test",
        resource: "repo",
        payload: {},
      },
      reasons: ["review"],
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    })
    expect((await store.approvalStore.list("tenant_test"))[0]?.id).toBe(approval.id)

    await store.governanceStateStore.saveState(
      { tenantId: "tenant_test", agentId: "agent_test", policyId: "default" },
      { velocity_ledger: { read: 1 }, replay_store: {} },
    )
    expect(
      (await store.governanceStateStore.getState({
        tenantId: "tenant_test",
        agentId: "agent_test",
        policyId: "default",
      })).velocity_ledger.read,
    ).toBe(1)

    store.close()
  })
})
