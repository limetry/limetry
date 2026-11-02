/**
 * Drizzle Postgres schema for the open-source Limetry server.
 *
 * Tables match the runtime `POSTGRES_MIGRATION_SQL` and live in
 * `DATABASE_SCHEMA_NAME` (default `evaluate`).
 */

import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import dotenvx from "@dotenvx/dotenvx"
import {
  bigserial,
  boolean,
  integer,
  jsonb,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core"

import { readDatabaseSchemaName } from "../schema-name.js"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..")

dotenvx.config({
  path: repoRoot,
  convention: "nextjs",
  quiet: true,
})

/**
 * Postgres schema named by `DATABASE_SCHEMA_NAME`.
 *
 * The schema object is exported so drizzle-kit tracks it. An unexported
 * `pgSchema()` is omitted from the snapshot and `push` tries to drop it.
 */
export const databaseSchema = pgSchema(readDatabaseSchemaName())

/**
 * Portal user belonging to a tenant.
 */
export const users = databaseSchema.table(
  "limetry_users",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    email: text("email").notNull(),
    name: text("name"),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    usersTenantEmail: unique("limetry_users_tenant_email").on(table.tenantId, table.email),
  }),
)

/**
 * API token issued to a user.
 */
export const accessTokens = databaseSchema.table("limetry_access_tokens", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  token: text("token").notNull().unique(),
  scopes: jsonb("scopes").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
})

/**
 * Tenant governance rule.
 */
export const rules = databaseSchema.table("limetry_rules", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  condition: text("condition").notNull(),
  action: text("action").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  priority: integer("priority").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
})

/**
 * Versioned action policy document.
 */
export const policies = databaseSchema.table(
  "limetry_policies",
  {
    tenantId: text("tenant_id").notNull(),
    policyId: text("policy_id").notNull(),
    policyJson: jsonb("policy_json").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    policiesPk: primaryKey({ columns: [table.tenantId, table.policyId] }),
  }),
)

/**
 * Per-agent evaluation state ledger.
 */
export const governanceState = databaseSchema.table(
  "limetry_governance_state",
  {
    tenantId: text("tenant_id").notNull(),
    agentId: text("agent_id").notNull(),
    policyId: text("policy_id").notNull(),
    stateJson: jsonb("state_json").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
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
export const auditLog = databaseSchema.table("limetry_audit_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  tenantId: text("tenant_id").notNull(),
  eventType: text("event_type").notNull(),
  subjectId: text("subject_id").notNull(),
  details: jsonb("details").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
})
