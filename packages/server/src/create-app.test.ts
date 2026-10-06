import { describe, expect, it, vi } from "vitest"

import { createApp } from "./create-app.js"
import { loadEnv } from "./env.js"
import type { PolicyRegistry } from "./services/policy-registry.js"

describe("createApp", () => {
  it("seeds a valid load-test policy into the default tenant", () => {
    const policyRegistry: PolicyRegistry = {
      registerPolicy: vi.fn(() => ({
        tenantId: "default",
        policy: {
          policy_id: "11111111-1111-4111-8111-111111111111",
          version: 1,
          organization_id: "load-test",
          agent_id: "agent_load_test",
          allowed_action_types: ["load_test"],
          updated_at: "2026-10-06T00:00:00.000Z",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      getPolicy: vi.fn(() => null),
      listPolicies: vi.fn(() => []),
    }
    const env = loadEnv({
      NODE_ENV: "test",
      LIMETRY_BEARER_TOKEN: "test-bearer-token-at-least-16",
      JWT_SECRET: "your-jwt-secret-change-in-production",
      LOAD_TEST_POLICY_JSON: JSON.stringify({
        policy_id: "11111111-1111-4111-8111-111111111111",
        version: 1,
        organization_id: "load-test",
        agent_id: "agent_load_test",
        allowed_action_types: ["load_test"],
        updated_at: "2026-10-06T00:00:00.000Z",
      }),
    })

    createApp({ env, policyRegistry })

    expect(policyRegistry.registerPolicy).toHaveBeenCalledWith(
      "default",
      expect.objectContaining({
        policy_id: "11111111-1111-4111-8111-111111111111",
      }),
    )
  })
})
