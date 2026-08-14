import { type ActionPolicy,createSlimActionPolicy } from "@limetry/sdk"

/**
 * Copilot / GitHub Actions coding-agent policy.
 * PR typecheck is allow. Fork deploys are denied by event trust before evaluate.
 * Trusted production deploys return approval_required.
 */
export const ciCodingAgentPolicy: ActionPolicy = createSlimActionPolicy({
  policyId: "22222222-2222-4222-8222-222222222222",
  organizationId: "org_acme",
  agentId: "github_copilot_coding_agent",
  allowedActionTypes: ["ci_privilege", "deploy"],
  deniedActionTypes: [],
  requireApprovalActionTypes: ["deploy"],
  auditMode: "minimal",
})

/**
 * Same policy id as packages/ci/policies/deploy.json for the composite Action.
 * Coding-agent flows should prefer ciCodingAgentPolicy.
 */
export const ciDeploymentPolicy: ActionPolicy = ciCodingAgentPolicy
