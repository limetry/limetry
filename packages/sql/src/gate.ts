/**
 * Postgres SQL action gate that evaluates intents before optional execution.
 */

import { randomUUID } from "node:crypto"

import {
  type ActionEvaluationResponse,
  type ActionIntent,
  RemotePolicyEngine,
} from "@limetry/sdk"
import pg from "pg"

import { actionTypeForSqlClass, classifySql, type SqlClass } from "./classify-sql.js"

/**
 * Successful ActionEvaluationResponse (`ok: true`) from `\@limetry/sdk`.
 */
type OkActionEvaluation = Extract<ActionEvaluationResponse, { ok: true }>

/**
 * Construction options for {@link SqlActionGate}.
 */
export type SqlGateOptions = {
  /**
   * Postgres connection string; never returned to callers.
   */
  connectionString: string
  /**
   * Limetry API key / bearer token.
   */
  apiKey: string
  /**
   * Limetry API base URL.
   */
  baseUrl?: string
  /**
   * Tenant id for multi-tenant evaluation.
   */
  tenantId?: string
  /**
   * ActionPolicy id used for every SQL intent.
   */
  policyId: string
  /**
   * Agent id recorded on intents; defaults to `sql_agent`.
   */
  agentId?: string
  /**
   * Resource label on the ActionIntent; defaults to `postgres://*`.
   */
  resourceLabel?: string
  /**
   * Default dry-run mode; defaults to `true`.
   */
  dryRun?: boolean
  /**
   * Optional fetch implementation for tests.
   */
  fetch?: typeof globalThis.fetch
  /**
   * Optional query runner that replaces the default `pg.Client` path.
   */
  queryRunner?: (sql: string) => Promise<unknown>
}

/**
 * Result of classify + evaluate + optional execute.
 */
export type SqlGateResult = {
  /**
   * Heuristic SQL class for the statement.
   */
  sqlClass: SqlClass
  /**
   * ActionIntent submitted for evaluation.
   */
  intent: ActionIntent
  /**
   * Successful remote evaluation response.
   */
  evaluation: OkActionEvaluation
  /**
   * Whether this call ran in dry-run mode.
   */
  dryRun: boolean
  /**
   * `true` only when `execute` was requested, dry-run was false, and decision was `allow`.
   */
  executed: boolean
  /**
   * Query result payload when `executed` is true.
   */
  rows?: unknown
}

/**
 * Owns Postgres credentials and evaluates SQL intents before optional execute.
 *
 * Execution requires `execute: true`, `dryRun: false`, and `decision === "allow"`.
 * `approval_required` decisions are tracked via {@link SqlActionGate.listPending}.
 */
export class SqlActionGate {
  private readonly connectionString: string
  private readonly engine: RemotePolicyEngine
  private readonly policyId: string
  private readonly agentId: string
  private readonly resourceLabel: string
  private readonly dryRunDefault: boolean
  private readonly queryRunner?: (sql: string) => Promise<unknown>
  private readonly pendingApprovals: Array<{
    approval_id: string
    decision_id: string
    sql: string
    sqlClass: SqlClass
  }> = []

  /**
   * @param options - DB connection, Limetry API settings, and dry-run default.
   */
  constructor(options: SqlGateOptions) {
    this.connectionString = options.connectionString
    this.policyId = options.policyId
    this.agentId = options.agentId ?? "sql_agent"
    this.resourceLabel = options.resourceLabel ?? "postgres://*"
    this.dryRunDefault = options.dryRun ?? true
    this.queryRunner = options.queryRunner
    this.engine = new RemotePolicyEngine({
      apiKey: options.apiKey,
      baseUrl: options.baseUrl,
      tenantId: options.tenantId,
      fetch: options.fetch,
    })
  }

  /**
   * Return a copy of in-process statements that received `approval_required`.
   *
   * @returns Pending approval entries with sql class and full SQL text.
   */
  listPending(): Array<{
    approval_id: string
    decision_id: string
    sql: string
    sqlClass: SqlClass
  }> {
    return [...this.pendingApprovals]
  }

  /**
   * Classify, evaluate, and optionally execute a SQL statement.
   *
   * Metadata includes `sql_class`, a 200-character `sql_preview`, and `dry_run`.
   *
   * @param input - SQL text plus optional dry-run / execute overrides.
   * @returns Classification, evaluation, and optional row payload.
   * @throws Error When Limetry evaluation returns `ok: false`.
   */
  async evaluateAndMaybeExecute(input: {
    sql: string
    dryRun?: boolean
    execute?: boolean
  }): Promise<SqlGateResult> {
    const sqlClass = classifySql(input.sql)
    const dryRun = input.dryRun ?? this.dryRunDefault
    const intent: ActionIntent = {
      intent_id: randomUUID(),
      policy_id: this.policyId,
      agent_id: this.agentId,
      action_type: actionTypeForSqlClass(sqlClass),
      resource: this.resourceLabel,
      metadata: {
        sql_class: sqlClass,
        sql_preview: input.sql.slice(0, 200),
        dry_run: String(dryRun),
      },
      issued_at: new Date().toISOString(),
    }

    const evaluation = await this.engine.evaluateAction(intent)
    if (!evaluation.ok) {
      throw new Error(evaluation.error ?? "Limetry evaluate failed")
    }
    if (evaluation.decision === "approval_required" && evaluation.approval_id) {
      this.pendingApprovals.push({
        approval_id: evaluation.approval_id,
        decision_id: evaluation.decision_id ?? "",
        sql: input.sql,
        sqlClass,
      })
    }

    const shouldExecute =
      Boolean(input.execute) &&
      !dryRun &&
      evaluation.decision === "allow"

    if (!shouldExecute) {
      return {
        sqlClass,
        intent,
        evaluation,
        dryRun,
        executed: false,
      }
    }

    const rows = await this.runQuery(input.sql)
    return {
      sqlClass,
      intent,
      evaluation,
      dryRun,
      executed: true,
      rows,
    }
  }

  /**
   * Execute SQL via the injected query runner or a short-lived `pg.Client`.
   *
   * @param sql - Statement to run.
   * @returns Query runner result, or `{ rowCount, rows, fields }` from `pg`.
   */
  private async runQuery(sql: string): Promise<unknown> {
    if (this.queryRunner) {
      return this.queryRunner(sql)
    }
    const client = new pg.Client({ connectionString: this.connectionString })
    await client.connect()
    try {
      const result = await client.query(sql)
      return {
        rowCount: result.rowCount,
        rows: result.rows,
        fields: result.fields.map((field) => field.name),
      }
    } finally {
      await client.end()
    }
  }
}
