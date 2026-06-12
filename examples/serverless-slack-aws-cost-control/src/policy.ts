import type { ActionPolicy } from "@limetry/sdk"

export const awsCostPolicy: ActionPolicy = {
  policy_id: "22222222-2222-4222-8222-222222222222",
  version: 1,
  organization_id: "org_demo",
  agent_id: "agent_aws_slack",
  allowed_action_types: ["aws_provision"],
  denied_action_types: [],
  allowed_resource_patterns: ["aws:ec2:*"],
  blocked_resource_patterns: [],
  /**
   * $10.00 USD (e.g. max hourly rate of any resource)
   */
  max_cost_minor: 1000,
  currency: "USD",
  status: "active",
  updated_at: "2026-07-09T19:27:40.000Z",
}
