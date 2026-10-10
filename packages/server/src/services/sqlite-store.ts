/**
 * Durable SQLite stores for single-process OSS self-hosting.
 *
 * SQLite intentionally uses the same logical tables and JSON payloads as the
 * Postgres stores while keeping local setup free of an external database.
 */

import { createHash, randomBytes, randomUUID } from "node:crypto"
import { mkdirSync } from "node:fs"
import { homedir } from "node:os"
import { dirname } from "node:path"
import { DatabaseSync } from "node:sqlite"

import type { ActionIntent, EvaluationState, PolicyEvaluationResponse } from "@limetry/sdk"

import type {
  ApprovalRecord,
  ApprovalStore,
  CreateApprovalInput,
  ResolveApprovalInput,
  ResolveApprovalResult,
} from "./approval-store.js"
import type {
  AppendAuditInput,
  AuditEvent,
  AuditListResult,
  AuditQuery,
  AuditStore,
} from "./audit-store.js"
import type { GovernanceStateKey, GovernanceStateStore } from "./governance-state-store.js"
import type { PolicyRegistry, RegistryPolicy, StoredPolicy } from "./policy-registry.js"
import {
  apiTokensEqual,
  type CreatedAccessToken,
  hashApiToken,
  hashPassword,
  type StoredAccessToken,
  type StoredRule,
  type StoredUser,
  type UserService,
  verifyPasswordHash,
} from "./user-service.js"

type SqliteRow = Record<string, string | number | null>

const EMPTY_STATE: EvaluationState = {
  velocity_ledger: {},
  replay_store: {},
}

function asRow(value: object | undefined): SqliteRow | null {
  return value ? (value as SqliteRow) : null
}

function dateValue(value: string | number | null): Date | null {
  return value === null ? null : new Date(String(value))
}

function requiredDate(value: string | number | null): Date {
  return dateValue(value) ?? new Date(0)
}

function generateToken(): string {
  return `limetry_${randomBytes(24).toString("hex")}`
}

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T
}

function serialize(value: object): string {
  return JSON.stringify(value)
}

function hashIntent(intent: ActionIntent): string {
  return createHash("sha256").update(JSON.stringify(intent)).digest("hex")
}

function createSchema(db: DatabaseSync): void {
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS limetry_users (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      email TEXT NOT NULL,
      name TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (tenant_id, email)
    );
    CREATE TABLE IF NOT EXISTS limetry_access_tokens (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES limetry_users(id),
      name TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      scopes TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      expires_at TEXT,
      last_used_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS limetry_rules (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      condition TEXT NOT NULL,
      action TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      priority INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS limetry_policies (
      tenant_id TEXT NOT NULL,
      policy_id TEXT NOT NULL,
      policy TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (tenant_id, policy_id)
    );
    CREATE TABLE IF NOT EXISTS limetry_governance_state (
      tenant_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      policy_id TEXT NOT NULL,
      state TEXT NOT NULL,
      PRIMARY KEY (tenant_id, agent_id, policy_id)
    );
    CREATE TABLE IF NOT EXISTS limetry_audit_log (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS limetry_approvals (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      decision_id TEXT NOT NULL,
      policy_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      resource TEXT NOT NULL,
      payload_hash TEXT NOT NULL,
      intent TEXT NOT NULL,
      reasons TEXT NOT NULL,
      status TEXT NOT NULL,
      reviewer TEXT,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      resolved_at TEXT
    );
  `)
}

export class SqliteUserService implements UserService {
  constructor(private readonly db: DatabaseSync) {}

  createUser(
    email: string,
    password: string,
    name: string | null,
    tenantId: string,
    role: "ADMIN" | "MEMBER" = "MEMBER",
  ): StoredUser {
    const now = new Date().toISOString()
    const user: StoredUser = {
      id: `user_${randomBytes(12).toString("hex")}`,
      tenantId,
      email,
      name,
      passwordHash: hashPassword(password),
      role,
      isActive: true,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    }
    try {
      this.db
        .prepare(
          `INSERT INTO limetry_users
            (id, tenant_id, email, name, password_hash, role, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          user.id,
          user.tenantId,
          user.email,
          user.name,
          user.passwordHash,
          user.role,
          1,
          now,
          now,
        )
    } catch {
      throw new Error("User already exists")
    }
    return user
  }

  getUserById(userId: string): StoredUser | null {
    return this.mapUser(asRow(this.db.prepare("SELECT * FROM limetry_users WHERE id = ?").get(userId)))
  }

  getUserByEmail(tenantId: string, email: string): StoredUser | null {
    return this.mapUser(
      asRow(
        this.db
          .prepare("SELECT * FROM limetry_users WHERE tenant_id = ? AND lower(email) = lower(?)")
          .get(tenantId, email),
      ),
    )
  }

  verifyPassword(user: StoredUser, password: string): boolean {
    return verifyPasswordHash(user.passwordHash, password)
  }

  updateUser(userId: string, updates: { name?: string | null }): StoredUser | null {
    const current = this.getUserById(userId)
    if (!current) return null
    const updatedAt = new Date().toISOString()
    this.db
      .prepare("UPDATE limetry_users SET name = ?, updated_at = ? WHERE id = ?")
      .run(updates.name === undefined ? current.name : updates.name, updatedAt, userId)
    return this.getUserById(userId)
  }

  changePassword(userId: string, oldPassword: string, newPassword: string): boolean {
    const user = this.getUserById(userId)
    if (!user || !this.verifyPassword(user, oldPassword)) return false
    this.db
      .prepare("UPDATE limetry_users SET password_hash = ?, updated_at = ? WHERE id = ?")
      .run(hashPassword(newPassword), new Date().toISOString(), userId)
    return true
  }

  createAccessToken(
    userId: string,
    tenantId: string,
    name: string,
    scopes: string[],
    expiresAt: Date | null = null,
  ): CreatedAccessToken {
    const plaintextToken = generateToken()
    const now = new Date().toISOString()
    const record: StoredAccessToken = {
      id: randomUUID(),
      tenantId,
      userId,
      name,
      tokenHash: hashApiToken(plaintextToken),
      scopes,
      isActive: true,
      expiresAt,
      lastUsedAt: null,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    }
    this.db
      .prepare(
        `INSERT INTO limetry_access_tokens
          (id, tenant_id, user_id, name, token_hash, scopes, is_active, expires_at, last_used_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.id,
        record.tenantId,
        record.userId,
        record.name,
        record.tokenHash,
        serialize(scopes),
        1,
        expiresAt?.toISOString() ?? null,
        null,
        now,
        now,
      )
    return { record, plaintextToken }
  }

  getAccessToken(tokenId: string): StoredAccessToken | null {
    return this.mapToken(
      asRow(this.db.prepare("SELECT * FROM limetry_access_tokens WHERE id = ?").get(tokenId)),
    )
  }

  getAccessTokenByValue(tokenValue: string): StoredAccessToken | null {
    const rows = this.db
      .prepare(
        "SELECT * FROM limetry_access_tokens WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > ?)",
      )
      .all(new Date().toISOString()) as object[]
    for (const row of rows) {
      const token = this.mapToken(asRow(row))
      if (token && apiTokensEqual(token.tokenHash, tokenValue)) {
        const now = new Date().toISOString()
        this.db
          .prepare("UPDATE limetry_access_tokens SET last_used_at = ?, updated_at = ? WHERE id = ?")
          .run(now, now, token.id)
        return { ...token, lastUsedAt: new Date(now), updatedAt: new Date(now) }
      }
    }
    return null
  }

  listUserTokens(userId: string): StoredAccessToken[] {
    const rows = this.db
      .prepare("SELECT * FROM limetry_access_tokens WHERE user_id = ? ORDER BY created_at DESC")
      .all(userId) as object[]
    return rows.map((row) => this.mapToken(asRow(row))).filter((row): row is StoredAccessToken => row !== null)
  }

  revokeToken(tokenId: string): boolean {
    const result = this.db
      .prepare("UPDATE limetry_access_tokens SET is_active = 0, updated_at = ? WHERE id = ? AND is_active = 1")
      .run(new Date().toISOString(), tokenId)
    return result.changes > 0
  }

  createRule(
    tenantId: string,
    name: string,
    description: string | null,
    condition: string,
    action: string,
    priority = 0,
  ): StoredRule {
    const now = new Date().toISOString()
    const rule: StoredRule = {
      id: randomUUID(),
      tenantId,
      name,
      description,
      condition,
      action,
      isActive: true,
      priority,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    }
    this.db
      .prepare(
        `INSERT INTO limetry_rules
          (id, tenant_id, name, description, condition, action, is_active, priority, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        rule.id,
        tenantId,
        name,
        description,
        condition,
        action,
        1,
        priority,
        now,
        now,
      )
    return rule
  }

  getRule(ruleId: string): StoredRule | null {
    return this.mapRule(asRow(this.db.prepare("SELECT * FROM limetry_rules WHERE id = ?").get(ruleId)))
  }

  listTenantRules(tenantId: string): StoredRule[] {
    const rows = this.db
      .prepare("SELECT * FROM limetry_rules WHERE tenant_id = ? ORDER BY priority ASC, created_at ASC")
      .all(tenantId) as object[]
    return rows.map((row) => this.mapRule(asRow(row))).filter((row): row is StoredRule => row !== null)
  }

  updateRule(
    ruleId: string,
    updates: {
      name?: string
      description?: string | null
      condition?: string
      action?: string
      priority?: number
      isActive?: boolean
    },
  ): StoredRule | null {
    const current = this.getRule(ruleId)
    if (!current) return null
    const next = {
      name: updates.name ?? current.name,
      description: updates.description === undefined ? current.description : updates.description,
      condition: updates.condition ?? current.condition,
      action: updates.action ?? current.action,
      priority: updates.priority ?? current.priority,
      isActive: updates.isActive ?? current.isActive,
    }
    this.db
      .prepare(
        `UPDATE limetry_rules
         SET name = ?, description = ?, condition = ?, action = ?, priority = ?, is_active = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(
        next.name,
        next.description,
        next.condition,
        next.action,
        next.priority,
        next.isActive ? 1 : 0,
        new Date().toISOString(),
        ruleId,
      )
    return this.getRule(ruleId)
  }

  deleteRule(ruleId: string): boolean {
    return this.db.prepare("DELETE FROM limetry_rules WHERE id = ?").run(ruleId).changes > 0
  }

  private mapUser(row: SqliteRow | null): StoredUser | null {
    if (!row) return null
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      email: String(row.email),
      name: row.name === null ? null : String(row.name),
      passwordHash: String(row.password_hash),
      role: String(row.role) as "ADMIN" | "MEMBER",
      isActive: Number(row.is_active) === 1,
      createdAt: requiredDate(row.created_at),
      updatedAt: requiredDate(row.updated_at),
    }
  }

  private mapToken(row: SqliteRow | null): StoredAccessToken | null {
    if (!row) return null
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      userId: String(row.user_id),
      name: String(row.name),
      tokenHash: String(row.token_hash),
      scopes: parseJson<string[]>(String(row.scopes)),
      isActive: Number(row.is_active) === 1,
      expiresAt: dateValue(row.expires_at),
      lastUsedAt: dateValue(row.last_used_at),
      createdAt: requiredDate(row.created_at),
      updatedAt: requiredDate(row.updated_at),
    }
  }

  private mapRule(row: SqliteRow | null): StoredRule | null {
    if (!row) return null
    return {
      id: String(row.id),
      tenantId: String(row.tenant_id),
      name: String(row.name),
      description: row.description === null ? null : String(row.description),
      condition: String(row.condition),
      action: String(row.action),
      isActive: Number(row.is_active) === 1,
      priority: Number(row.priority),
      createdAt: requiredDate(row.created_at),
      updatedAt: requiredDate(row.updated_at),
    }
  }
}

export class SqlitePolicyRegistry implements PolicyRegistry {
  constructor(private readonly db: DatabaseSync) {}

  registerPolicy(tenantId: string, policy: RegistryPolicy): StoredPolicy {
    const existing = this.getPolicy(tenantId, policy.policy_id)
    const now = new Date().toISOString()
    this.db
      .prepare(
        `INSERT INTO limetry_policies (tenant_id, policy_id, policy, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (tenant_id, policy_id)
         DO UPDATE SET policy = excluded.policy, updated_at = excluded.updated_at`,
      )
      .run(tenantId, policy.policy_id, serialize(policy), existing?.createdAt.toISOString() ?? now, now)
    return this.getPolicy(tenantId, policy.policy_id) as StoredPolicy
  }

  getPolicy(tenantId: string, policyId: string): StoredPolicy | null {
    const row = asRow(
      this.db
        .prepare("SELECT * FROM limetry_policies WHERE tenant_id = ? AND policy_id = ?")
        .get(tenantId, policyId),
    )
    if (!row) return null
    return {
      tenantId: String(row.tenant_id),
      policy: parseJson<RegistryPolicy>(String(row.policy)),
      createdAt: requiredDate(row.created_at),
      updatedAt: requiredDate(row.updated_at),
    }
  }

  listPolicies(tenantId: string): StoredPolicy[] {
    const rows = this.db
      .prepare("SELECT * FROM limetry_policies WHERE tenant_id = ? ORDER BY policy_id")
      .all(tenantId) as object[]
    return rows
      .map((row) => this.getPolicy(tenantId, String((row as SqliteRow).policy_id)))
      .filter((row): row is StoredPolicy => row !== null)
  }
}

export class SqliteAuditStore implements AuditStore {
  constructor(private readonly db: DatabaseSync) {}

  async append(input: AppendAuditInput): Promise<AuditEvent> {
    const event: AuditEvent = {
      id: randomUUID(),
      tenant_id: input.tenant_id,
      event_type: input.event_type,
      subject_id: input.subject_id,
      details: input.details,
      created_at: new Date().toISOString(),
    }
    this.db
      .prepare(
        `INSERT INTO limetry_audit_log
          (id, tenant_id, event_type, subject_id, details, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        event.id,
        event.tenant_id,
        event.event_type,
        event.subject_id,
        serialize(event.details),
        event.created_at,
      )
    return event
  }

  async list(tenantId: string, query: AuditQuery): Promise<AuditListResult> {
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 200)
    const rows = this.db
      .prepare(
        `SELECT * FROM limetry_audit_log
         WHERE tenant_id = ?
           AND (? IS NULL OR event_type = ?)
           AND (? IS NULL OR id < ?)
         ORDER BY created_at DESC, id DESC
         LIMIT ?`,
      )
      .all(
        tenantId,
        query.event_type ?? null,
        query.event_type ?? null,
        query.cursor ?? null,
        query.cursor ?? null,
        limit + 1,
      ) as object[]
    const events = rows.slice(0, limit).map((row) => {
      const value = row as SqliteRow
      return {
        id: String(value.id),
        tenant_id: String(value.tenant_id),
        event_type: String(value.event_type),
        subject_id: String(value.subject_id),
        details: parseJson<Record<string, unknown>>(String(value.details)),
        created_at: String(value.created_at),
      }
    })
    return {
      events,
      next_cursor: rows.length > limit ? events.at(-1)?.id : undefined,
    }
  }
}

export class SqliteApprovalStore implements ApprovalStore {
  constructor(private readonly db: DatabaseSync) {}

  async create(input: CreateApprovalInput): Promise<ApprovalRecord> {
    const record: ApprovalRecord = {
      id: randomUUID(),
      tenant_id: input.tenant_id,
      decision_id: input.decision_id,
      policy_id: input.policy_id,
      agent_id: input.agent_id,
      action_type: input.action_type,
      resource: input.resource,
      payload_hash: input.payload_hash,
      intent: input.intent,
      reasons: input.reasons,
      status: "pending",
      created_at: new Date().toISOString(),
      expires_at: input.expires_at,
    }
    this.db
      .prepare(
        `INSERT INTO limetry_approvals
          (id, tenant_id, decision_id, policy_id, agent_id, action_type, resource, payload_hash,
           intent, reasons, status, reviewer, created_at, expires_at, resolved_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.id,
        record.tenant_id,
        record.decision_id,
        record.policy_id,
        record.agent_id,
        record.action_type,
        record.resource,
        record.payload_hash,
        serialize(record.intent),
        serialize(record.reasons),
        record.status,
        null,
        record.created_at,
        record.expires_at,
        null,
      )
    return record
  }

  async list(tenantId: string, options?: { status?: string }): Promise<ApprovalRecord[]> {
    const status = options?.status ?? "pending"
    const rows = this.db
      .prepare(
        `SELECT * FROM limetry_approvals
         WHERE tenant_id = ? AND (? = 'all' OR status = ?)
         ORDER BY created_at DESC`,
      )
      .all(tenantId, status, status) as object[]
    return rows.map((row) => this.map(row as SqliteRow))
  }

  async resolve(input: ResolveApprovalInput): Promise<ResolveApprovalResult> {
    const row = asRow(
      this.db.prepare("SELECT * FROM limetry_approvals WHERE tenant_id = ? AND id = ?").get(
        input.tenantId,
        input.approvalId,
      ),
    )
    if (!row) {
      return { ok: false, status: 404, code: "approval_not_found", error: "Approval not found" }
    }
    const record = this.map(row)
    if (record.status !== "pending") {
      return {
        ok: false,
        status: 409,
        code: "approval_not_pending",
        error: `Approval is already ${record.status}`,
      }
    }
    if (new Date(record.expires_at).getTime() <= Date.now()) {
      this.db.prepare("UPDATE limetry_approvals SET status = ? WHERE id = ?").run("expired", record.id)
      return { ok: false, status: 410, code: "approval_expired", error: "Approval has expired" }
    }
    if (input.decision === "approved" && input.intent && hashIntent(input.intent) !== record.payload_hash) {
      return {
        ok: false,
        status: 409,
        code: "payload_mismatch",
        error: "Intent payload hash does not match the pending approval",
      }
    }
    const resolvedAt = new Date().toISOString()
    this.db
      .prepare(
        "UPDATE limetry_approvals SET status = ?, reviewer = ?, resolved_at = ? WHERE id = ?",
      )
      .run(input.decision, input.reviewer, resolvedAt, record.id)
    return {
      ok: true,
      approval: {
        ...record,
        status: input.decision,
        reviewer: input.reviewer,
        resolved_at: resolvedAt,
      },
    }
  }

  private map(row: SqliteRow): ApprovalRecord {
    return {
      id: String(row.id),
      tenant_id: String(row.tenant_id),
      decision_id: String(row.decision_id),
      policy_id: String(row.policy_id),
      agent_id: String(row.agent_id),
      action_type: String(row.action_type),
      resource: String(row.resource),
      payload_hash: String(row.payload_hash),
      intent: parseJson<ActionIntent>(String(row.intent)),
      reasons: parseJson<string[]>(String(row.reasons)),
      status: String(row.status) as ApprovalRecord["status"],
      reviewer: row.reviewer === null ? undefined : String(row.reviewer),
      created_at: String(row.created_at),
      expires_at: String(row.expires_at),
      resolved_at: row.resolved_at === null ? undefined : String(row.resolved_at),
    }
  }
}

export class SqliteGovernanceStateStore implements GovernanceStateStore {
  constructor(private readonly db: DatabaseSync) {}

  async getState(key: GovernanceStateKey): Promise<EvaluationState> {
    const row = asRow(
      this.db
        .prepare(
          "SELECT state FROM limetry_governance_state WHERE tenant_id = ? AND agent_id = ? AND policy_id = ?",
        )
        .get(key.tenantId, key.agentId, key.policyId),
    )
    return row ? parseJson<EvaluationState>(String(row.state)) : structuredClone(EMPTY_STATE)
  }

  async saveState(key: GovernanceStateKey, state: EvaluationState): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO limetry_governance_state (tenant_id, agent_id, policy_id, state)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (tenant_id, agent_id, policy_id)
         DO UPDATE SET state = excluded.state`,
      )
      .run(key.tenantId, key.agentId, key.policyId, serialize(state))
  }

  async evaluateAndSave(
    key: GovernanceStateKey,
    evaluator: (state: EvaluationState) => PolicyEvaluationResponse,
  ): Promise<PolicyEvaluationResponse> {
    // BEGIN IMMEDIATE serializes the read/evaluate/write sequence with other
    // processes using this database, preventing concurrent evaluations from
    // overwriting each other's state.
    this.db.exec("BEGIN IMMEDIATE")
    try {
      const row = asRow(
        this.db
          .prepare(
            "SELECT state FROM limetry_governance_state WHERE tenant_id = ? AND agent_id = ? AND policy_id = ?",
          )
          .get(key.tenantId, key.agentId, key.policyId),
      )
      const state = row ? parseJson<EvaluationState>(String(row.state)) : structuredClone(EMPTY_STATE)
      const result = evaluator(state)
      if (result.state) {
        this.db
          .prepare(
            `INSERT INTO limetry_governance_state (tenant_id, agent_id, policy_id, state)
             VALUES (?, ?, ?, ?)
             ON CONFLICT (tenant_id, agent_id, policy_id)
             DO UPDATE SET state = excluded.state`,
          )
          .run(key.tenantId, key.agentId, key.policyId, serialize(result.state))
      }
      this.db.exec("COMMIT")
      return result
    } catch (error) {
      this.db.exec("ROLLBACK")
      throw error
    }
  }
}

export class SqliteStore {
  readonly userService: SqliteUserService
  readonly policyRegistry: SqlitePolicyRegistry
  readonly auditStore: SqliteAuditStore
  readonly approvalStore: SqliteApprovalStore
  readonly governanceStateStore: SqliteGovernanceStateStore

  private constructor(private readonly db: DatabaseSync) {
    createSchema(db)
    this.userService = new SqliteUserService(db)
    this.policyRegistry = new SqlitePolicyRegistry(db)
    this.auditStore = new SqliteAuditStore(db)
    this.approvalStore = new SqliteApprovalStore(db)
    this.governanceStateStore = new SqliteGovernanceStateStore(db)
  }

  static open(databasePath: string): SqliteStore {
    const resolvedPath = databasePath.startsWith("~/")
      ? `${homedir()}${databasePath.slice(1)}`
      : databasePath
    if (resolvedPath !== ":memory:") {
      mkdirSync(dirname(resolvedPath), { recursive: true })
    }
    return new SqliteStore(new DatabaseSync(resolvedPath))
  }

  close(): void {
    this.db.close()
  }
}
