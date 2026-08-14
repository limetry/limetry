import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

type ActionPolicyFile = {
  policy_id: string
  agent_id: string
  allowed_action_types: string[]
  denied_action_types?: string[]
}

const policiesDir = join(dirname(fileURLToPath(import.meta.url)), "../policies")

function readPolicy(fileName: string): ActionPolicyFile {
  return JSON.parse(readFileSync(join(policiesDir, fileName), "utf8")) as ActionPolicyFile
}

describe("repo ActionPolicies", () => {
  it("allows ci_privilege and denies deploy for PR/test jobs", () => {
    const policy = readPolicy("ci-privilege.json")
    expect(policy.agent_id).toBe("github_actions")
    expect(policy.allowed_action_types).toEqual(["ci_privilege"])
    expect(policy.denied_action_types).toEqual(["deploy"])
    expect(policy.policy_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
  })

  it("allows deploy for the infra workflow after a trusted event", () => {
    const policy = readPolicy("deploy.json")
    expect(policy.agent_id).toBe("github_actions")
    expect(policy.allowed_action_types).toEqual(["ci_privilege", "deploy"])
    expect(policy.denied_action_types ?? []).toEqual([])
  })
})
