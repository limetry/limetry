import { SqlActionGate } from "@limetry/sql"

import { sqlAgentDbPolicy } from "./policy.js"

export function setupDemoGate(options: {
  apiKey: string
  policyId?: string
  fetch: typeof globalThis.fetch
  queryRunner?: (sql: string) => Promise<unknown>
  agentId?: string
}): SqlActionGate {
  return new SqlActionGate({
    connectionString: "postgresql://localhost:5432/mock",
    apiKey: options.apiKey,
    policyId: options.policyId ?? sqlAgentDbPolicy.policy_id,
    agentId: options.agentId ?? sqlAgentDbPolicy.agent_id,
    fetch: options.fetch,
    queryRunner: options.queryRunner || (async (sql) => {
      return { rows: [{ result: "mocked execute: " + sql }] }
    }),
    dryRun: false,
  })
}
