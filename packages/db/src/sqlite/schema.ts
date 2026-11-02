/**
 * Drizzle SQLite schema for single-process open-source Limetry.
 *
 * Column names match `SqliteStore` so `db:setup` and the server create the
 * same tables. SQLite has no schema namespace; `DATABASE_SCHEMA_NAME` applies
 * only to Postgres.
 */

import { integer, primaryKey, sqliteTable, text, unique } from "drizzle-orm/sqlite-core"

/**
 * Portal user belonging to a tenant.
 */
export const users = sqliteTable(
  "limetry_users",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    email: text("email").notNull(),
    name: text("name"),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull(),
    isActive: integer("is_active").notNull().default(1),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    usersTenantEmail: unique("limetry_users_tenant_email").on(table.tenantId, table.email),
  }),
)

/**
 * API token issued to a user.
 */
export const accessTokens = sqliteTable("limetry_access_tokens", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  tokenHash: text("token_hash").notNull(),
  scopes: text("scopes").notNull(),
  isActive: integer("is_active").notNull().default(1),
  expiresAt: text("expires_at"),
  lastUsedAt: text("last_used_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
})

/**
 * Tenant governance rule.
 */
export const rules = sqliteTable("limetry_rules", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  condition: text("condition").notNull(),
  action: text("action").notNull(),
  isActive: integer("is_active").notNull().default(1),
  priority: integer("priority").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
})

/**
 * Versioned action policy document.
 */
export const policies = sqliteTable(
  "limetry_policies",
  {
    tenantId: text("tenant_id").notNull(),
    policyId: text("policy_id").notNull(),
    policy: text("policy").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    policiesPk: primaryKey({ columns: [table.tenantId, table.policyId] }),
  }),
)

/**
 * Per-agent evaluation state ledger.
 */
export const governanceState = sqliteTable(
  "limetry_governance_state",
  {
    tenantId: text("tenant_id").notNull(),
    agentId: text("agent_id").notNull(),
    policyId: text("policy_id").notNull(),
    state: text("state").notNull(),
  },
  (table) => ({
    governanceStatePk: primaryKey({
      columns: [table.tenantId, table.agentId, table.policyId],
    }),
  }),
)

/**
 * Append-only audit log.
 */
export const auditLog = sqliteTable("limetry_audit_log", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  eventType: text("event_type").notNull(),
  subjectId: text("subject_id").notNull(),
  details: text("details").notNull(),
  createdAt: text("created_at").notNull(),
})

/**
 * Human approval waiting on a high-risk intent.
 */
export const approvals = sqliteTable("limetry_approvals", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  decisionId: text("decision_id").notNull(),
  policyId: text("policy_id").notNull(),
  agentId: text("agent_id").notNull(),
  actionType: text("action_type").notNull(),
  resource: text("resource").notNull(),
  payloadHash: text("payload_hash").notNull(),
  intent: text("intent").notNull(),
  reasons: text("reasons").notNull(),
  status: text("status").notNull(),
  reviewer: text("reviewer"),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at").notNull(),
  resolvedAt: text("resolved_at"),
})
