#!/usr/bin/env node
/**
 * Live CI demo entrypoint that classifies and evaluates SQL through Limetry.
 *
 * Uses `dryRun: false` so allowed reads can execute when `INPUT_EXECUTE` is not `"false"`.
 */

import { resolveLimetryBaseUrl } from "@limetry/sdk"

import { SqlActionGate } from "./gate.js"

/**
 * Test overrides for {@link runSqlCiDemo}.
 */
export type SqlCiDemoOverrides = {
  /**
   * Optional fetch used by the Limetry client.
   */
  fetch?: typeof fetch
  /**
   * Optional query runner replacing the default Postgres client.
   */
  queryRunner?: (sql: string) => Promise<unknown>
}

/**
 * Classify and evaluate a SQL statement against Limetry for the live CI demo.
 * Allowed reads may execute. Writes and DDL must be denied before Postgres is touched.
 *
 * @param env - Process environment; defaults to `process.env`.
 * @param overrides - Optional fetch / queryRunner overrides for tests.
 * @returns Process exit code (`0` allow, `1` deny / missing inputs).
 * @throws Propagates unexpected evaluation or query errors to the direct-run handler.
 */
export async function runSqlCiDemo(
  env: NodeJS.ProcessEnv = process.env,
  overrides: SqlCiDemoOverrides = {},
): Promise<number> {
  const apiKey = env.INPUT_LIMETRY_API_KEY ?? env.LIMETRY_API_KEY ?? ""
  const baseUrl = resolveLimetryBaseUrl(env, env.INPUT_LIMETRY_BASE_URL ?? env.LIMETRY_BASE_URL)
  const policyId = env.INPUT_POLICY_ID ?? env.LIMETRY_POLICY_ID ?? ""
  const agentId = env.INPUT_AGENT_ID ?? "sql_agent"
  const sql = env.INPUT_SQL ?? env.LIMETRY_SQL ?? "SELECT 1 AS ok"
  const connectionString =
    env.DATABASE_URL ?? env.SUPABASE_DB_URL ?? "postgresql://limetry:limetry@127.0.0.1:5432/limetry"
  const execute = (env.INPUT_EXECUTE ?? "true") !== "false"

  if (!apiKey || !policyId) {
    process.stderr.write("Missing required SQL demo inputs (api key or policy id)\n")
    return 1
  }

  const gate = new SqlActionGate({
    connectionString,
    apiKey,
    baseUrl,
    policyId,
    agentId,
    resourceLabel: env.INPUT_RESOURCE ?? "postgres://limetry-ci/demo",
    dryRun: false,
    fetch: overrides.fetch,
    queryRunner: overrides.queryRunner,
  })

  const result = await gate.evaluateAndMaybeExecute({
    sql,
    dryRun: false,
    execute,
  })

  const decision = result.evaluation.decision ?? "deny"
  process.stdout.write(
    `Limetry ${decision} for ${result.intent.action_type} (${result.sqlClass})` +
      ` executed=${String(result.executed)}\n`,
  )

  if (decision === "allow") {
    return 0
  }

  process.stderr.write(
    `Limetry denied ${result.intent.action_type}: ${(result.evaluation.reasons ?? []).join("; ")}\n`,
  )
  return 1
}

/**
 * True when this module is executed directly rather than imported.
 */
const isDirectRun =
  process.argv[1]?.endsWith("run-ci-demo.js") ||
  process.argv[1]?.endsWith("run-ci-demo.ts")

if (isDirectRun) {
  void runSqlCiDemo()
    .then((code) => {
      process.exit(code)
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      process.stderr.write(`${message}\n`)
      process.exit(1)
    })
}
