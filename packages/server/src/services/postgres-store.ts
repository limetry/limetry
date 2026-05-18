/**
 * Postgres policy registry, governance state store, and schema migration SQL.
 */

import type {
  EvaluationState,
  PolicyEvaluationResponse,
} from "@limetry/sdk"
import {
  type Pool,
  type PoolClient,
  type QueryResult,
  type QueryResultRow,
} from "pg"

import type {
  GovernanceStateKey,
  GovernanceStateStore,
} from "./governance-state-store.js"
import type { PolicyRegistry, RegistryPolicy, StoredPolicy } from "./policy-registry.js"

/**
 * Minimal queryable database surface used by registry stores.
 */
type Database = {
  /**
   * Runs a parameterized SQL query.
   *
   * @typeParam Row - Expected row shape.
   * @param sql - SQL text.
   * @param params - Query parameters.
   * @returns Query result.
   */
  query<Row extends QueryResultRow = QueryResultRow>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<QueryResult<Row>>
}

/**
 * Database that can open a transactional client (for `FOR UPDATE`).
 */
type TransactionalDatabase = Database & {
  /**
   * Acquires a pooled client.
   *
   * @returns Connected client that must be released.
   */
  connect(): Promise<PoolClient>
}

/**
 * Returns an empty evaluation state ledger.
 *
 * @returns Empty velocity and replay stores.
 */
const emptyState = (): EvaluationState => ({
  velocity_ledger: {},
  replay_store: {},
})

/**
 * Postgres-backed {@link PolicyRegistry} writing to `limetry_policies`.
 */
export class PostgresPolicyRegistry implements PolicyRegistry {
  /**
   * @param database - Pool or queryable database.
   */
  constructor(private readonly database: Database) {}

  /**
   * Upserts a policy row keyed by `(tenant_id, policy_id)`.
   *
   * @param tenantId - Tenant scope.
   * @param policy - Policy document.
   * @returns Stored metadata wrapper.
   * @throws When the SQL upsert fails.
   */
  async registerPolicy(tenantId: string, policy: RegistryPolicy): Promise<StoredPolicy> {
    const now = new Date()
    const result = await this.database.query<{
      created_at: Date
      updated_at: Date
    }>(
      `INSERT INTO limetry_policies (
         tenant_id, policy_id, policy_json, created_at, updated_at
       )
       VALUES ($1, $2, $3::jsonb, $4, $4)
       ON CONFLICT (tenant_id, policy_id)
       DO UPDATE SET
         policy_json = EXCLUDED.policy_json,
         updated_at = EXCLUDED.updated_at
       RETURNING created_at, updated_at`,
      [tenantId, policy.policy_id, JSON.stringify(policy), now],
    )
    const row = result.rows[0]

    return {
      tenantId,
      policy,
      createdAt: row?.created_at ?? now,
      updatedAt: row?.updated_at ?? now,
    }
  }

  /**
   * Fetches a policy by tenant and id.
   *
   * @param tenantId - Tenant scope.
   * @param policyId - Policy id.
   * @returns Stored policy or `null`.
   * @throws When the SQL select fails.
   */
  async getPolicy(tenantId: string, policyId: string): Promise<StoredPolicy | null> {
    const result = await this.database.query<{
      policy_json: RegistryPolicy
      created_at: Date
      updated_at: Date
    }>(
      `SELECT policy_json, created_at, updated_at
       FROM limetry_policies
       WHERE tenant_id = $1 AND policy_id = $2`,
      [tenantId, policyId],
    )
    const row = result.rows[0]

    return row
      ? {
        tenantId,
        policy: row.policy_json,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
      : null
  }

  /**
   * Lists policies for a tenant ordered by `updated_at` descending.
   *
   * @param tenantId - Tenant scope.
   * @returns Stored policies.
   * @throws When the SQL select fails.
   */
  async listPolicies(tenantId: string): Promise<StoredPolicy[]> {
    const result = await this.database.query<{
      policy_json: RegistryPolicy
      created_at: Date
      updated_at: Date
    }>(
      `SELECT policy_json, created_at, updated_at
       FROM limetry_policies
       WHERE tenant_id = $1
       ORDER BY updated_at DESC`,
      [tenantId],
    )

    return result.rows.map((row) => ({
      tenantId,
      policy: row.policy_json,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  }
}

/**
 * Postgres-backed {@link GovernanceStateStore} with row-level locking.
 */
export class PostgresGovernanceStateStore implements GovernanceStateStore {
  /**
   * @param database - Pool capable of `connect()` for transactions.
   */
  constructor(private readonly database: TransactionalDatabase) {}

  /**
   * Loads state JSON or returns an empty ledger when missing.
   *
   * @param key - Composite state key.
   * @returns Evaluation state.
   * @throws When the SQL select fails.
   */
  async getState(key: GovernanceStateKey): Promise<EvaluationState> {
    const result = await this.database.query<{ state_json: EvaluationState }>(
      `SELECT state_json
       FROM limetry_governance_state
       WHERE tenant_id = $1 AND agent_id = $2 AND policy_id = $3`,
      [key.tenantId, key.agentId, key.policyId],
    )

    return result.rows[0]?.state_json ?? emptyState()
  }

  /**
   * Upserts state JSON for a key.
   *
   * @param key - Composite state key.
   * @param state - State to persist.
   * @returns Nothing.
   * @throws When the SQL upsert fails.
   */
  async saveState(key: GovernanceStateKey, state: EvaluationState): Promise<void> {
    await this.database.query(
      `INSERT INTO limetry_governance_state (
         tenant_id, agent_id, policy_id, state_json, updated_at
       )
       VALUES ($1, $2, $3, $4::jsonb, NOW())
       ON CONFLICT (tenant_id, agent_id, policy_id)
       DO UPDATE SET
         state_json = EXCLUDED.state_json,
         updated_at = EXCLUDED.updated_at`,
      [key.tenantId, key.agentId, key.policyId, JSON.stringify(state)],
    )
  }

  /**
   * Atomically evaluates under `FOR UPDATE` and persists state when ok.
   *
   * @param key - Composite state key.
   * @param evaluator - Pure function of current state.
   * @returns Evaluation response.
   * @throws When the transaction fails (after ROLLBACK).
   */
  async evaluateAndSave(
    key: GovernanceStateKey,
    evaluator: (state: EvaluationState) => PolicyEvaluationResponse,
  ): Promise<PolicyEvaluationResponse> {
    const client = await this.database.connect()

    try {
      await client.query("BEGIN")
      await client.query(
        `INSERT INTO limetry_governance_state (
           tenant_id, agent_id, policy_id, state_json, updated_at
         )
         VALUES ($1, $2, $3, $4::jsonb, NOW())
         ON CONFLICT (tenant_id, agent_id, policy_id) DO NOTHING`,
        [key.tenantId, key.agentId, key.policyId, JSON.stringify(emptyState())],
      )
      const locked = await client.query<{ state_json: EvaluationState }>(
        `SELECT state_json
         FROM limetry_governance_state
         WHERE tenant_id = $1 AND agent_id = $2 AND policy_id = $3
         FOR UPDATE`,
        [key.tenantId, key.agentId, key.policyId],
      )
      const result = evaluator(locked.rows[0]?.state_json ?? emptyState())

      if (result.ok && result.state) {
        await client.query(
          `UPDATE limetry_governance_state
           SET state_json = $4::jsonb, updated_at = NOW()
           WHERE tenant_id = $1 AND agent_id = $2 AND policy_id = $3`,
          [key.tenantId, key.agentId, key.policyId, JSON.stringify(result.state)],
        )
      }

      await client.query("COMMIT")
      return result
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  }
}

/**
 * Applies {@link POSTGRES_MIGRATION_SQL} against a pool (idempotent DDL).
 *
 * @param pool - Postgres pool.
 * @returns Nothing.
 * @throws When migration SQL fails.
 */
export async function migratePostgres(pool: Pool): Promise<void> {
  await pool.query(POSTGRES_MIGRATION_SQL)
}

/**
 * Idempotent DDL creating OSS Limetry tables (users, tokens, rules, policies,
 * governance state, audit log).
 */
export const POSTGRES_MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS limetry_users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, email)
);

CREATE TABLE IF NOT EXISTS limetry_access_tokens (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES limetry_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  scopes JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS limetry_rules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  condition TEXT NOT NULL,
  action TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS limetry_policies (
  tenant_id TEXT NOT NULL,
  policy_id TEXT NOT NULL,
  policy_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (tenant_id, policy_id)
);

CREATE TABLE IF NOT EXISTS limetry_governance_state (
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  policy_id TEXT NOT NULL,
  state_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (tenant_id, agent_id, policy_id)
);

CREATE TABLE IF NOT EXISTS limetry_audit_log (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  details JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);
`
