/**
 * Best-effort PutItem into the shared Cloud `audit_log` DynamoDB table for
 * public site events (Ask Limetry + contact).
 *
 * Same item shape as enterprise `dynamo-audit-log` so Streams/TTL/archive work.
 * Synthetic PK: `site:{host}:{channel}` — isolated from org tenant partitions.
 */

import { randomUUID } from "node:crypto"

import {
  type AttributeValue,
  DynamoDBClient,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb"

/** Channel segment for site partition keys. */
export type SiteAuditChannel = "assistant" | "contact"

/** Optional overrides for tests. */
export type SiteAuditDeps = {
  client?: DynamoDBClient
  tableName?: string
}

export type PutSiteAuditEventInput = {
  tenantId: string
  action: string
  resourceType: string
  resourceId?: string
  actorUserId?: string
  metadata?: Record<string, unknown>
  retentionDays: number
  id?: string
  createdAt?: string
}

const DEFAULT_MAX_METADATA_CHARS = 350_000

let sharedClient: DynamoDBClient | undefined

/**
 * Builds the synthetic multi-tenant PK for a site channel partition.
 *
 * @param host - Site hostname (e.g. `limetry.org`).
 * @param channel - Event channel (`assistant` | `contact`).
 * @returns Partition key `site:{host}:{channel}`.
 */
export function siteTenantId(host: string, channel: SiteAuditChannel): string {
  const normalized = host.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "")
  if (!normalized) {
    throw new Error("siteTenantId requires a non-empty host")
  }
  return `site:${normalized}:${channel}`
}

/**
 * Resolves the site audit host from env (default `limetry.org`).
 *
 * @param env - Process env or override map.
 * @returns Hostname without scheme.
 */
export function resolveSiteAuditHost(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): string {
  const raw = env.SITE_AUDIT_HOST?.trim()
  if (raw) {
    return raw.replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase()
  }
  return "limetry.org"
}

/**
 * Resolves fixed site-event retention days (default 90).
 *
 * @param env - Process env or override map.
 * @returns Retention days for TTL.
 */
export function resolveSiteAuditRetentionDays(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): number {
  const raw = env.SITE_AUDIT_RETENTION_DAYS?.trim()
  if (!raw) {
    return 90
  }
  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 90
  }
  return parsed
}

/**
 * Resolves the Dynamo table name, or undefined when logging is disabled.
 *
 * @param deps - Optional table override.
 * @returns Table name or undefined.
 */
export function resolveSiteAuditTableName(deps: SiteAuditDeps = {}): string | undefined {
  const name = deps.tableName ?? process.env.AUDIT_LOG_TABLE?.trim()
  return name || undefined
}

function clientFrom(deps: SiteAuditDeps): DynamoDBClient {
  if (deps.client) {
    return deps.client
  }
  if (!sharedClient) {
    sharedClient = new DynamoDBClient({})
  }
  return sharedClient
}

function sortKey(createdAt: string, id: string): string {
  return `${createdAt}#${id}`
}

/**
 * Truncates string metadata values so the Dynamo item stays under ~400KB.
 *
 * @param metadata - Raw metadata object.
 * @param maxChars - Soft cap on JSON length.
 * @returns Possibly truncated metadata.
 */
export function truncateSiteMetadata(
  metadata: Record<string, unknown>,
  maxChars = DEFAULT_MAX_METADATA_CHARS,
): Record<string, unknown> {
  const encoded = JSON.stringify(metadata)
  if (encoded.length <= maxChars) {
    return metadata
  }
  const out: Record<string, unknown> = { ...metadata, _truncated: true }
  for (const key of Object.keys(out)) {
    const value = out[key]
    if (typeof value === "string" && value.length > 2_000) {
      out[key] = `${value.slice(0, 2_000)}…`
    }
  }
  let next = JSON.stringify(out)
  if (next.length <= maxChars) {
    return out
  }
  // Drop large string fields until under budget (keep flags).
  for (const key of Object.keys(out)) {
    if (typeof out[key] === "string" && key !== "_truncated") {
      out[key] = "[truncated]"
      next = JSON.stringify(out)
      if (next.length <= maxChars) {
        return out
      }
    }
  }
  return { _truncated: true, note: "metadata exceeded Dynamo item budget" }
}

function marshallItem(input: {
  tenantId: string
  sk: string
  id: string
  actorUserId: string
  action: string
  resourceType: string
  resourceId?: string
  metadata: Record<string, unknown>
  createdAt: string
  ttl: number
}): Record<string, AttributeValue> {
  const out: Record<string, AttributeValue> = {
    tenant_id: { S: input.tenantId },
    sk: { S: input.sk },
    id: { S: input.id },
    actor_user_id: { S: input.actorUserId },
    action: { S: input.action },
    resource_type: { S: input.resourceType },
    metadata: { S: JSON.stringify(input.metadata) },
    created_at: { S: input.createdAt },
    ttl: { N: String(input.ttl) },
  }
  if (input.resourceId) {
    out.resource_id = { S: input.resourceId }
  }
  return out
}

/**
 * Puts one site audit event. No-ops when `AUDIT_LOG_TABLE` is unset.
 *
 * @param input - Event fields (must include fixed `retentionDays`).
 * @param deps - Optional client/table overrides.
 * @returns Inserted id/createdAt, or null when skipped.
 */
export async function putSiteAuditEvent(
  input: PutSiteAuditEventInput,
  deps: SiteAuditDeps = {},
): Promise<{ id: string; createdAt: string } | null> {
  const tableName = resolveSiteAuditTableName(deps)
  if (!tableName) {
    console.warn("[site-audit] AUDIT_LOG_TABLE unset; skipping PutItem")
    return null
  }

  const id = input.id ?? `audit_${randomUUID()}`
  const createdAt = input.createdAt ?? new Date().toISOString()
  const ttl = Math.floor(new Date(createdAt).getTime() / 1000)
    + input.retentionDays * 24 * 60 * 60
  const metadata = truncateSiteMetadata(input.metadata ?? {})

  await clientFrom(deps).send(new PutItemCommand({
    TableName: tableName,
    Item: marshallItem({
      tenantId: input.tenantId,
      sk: sortKey(createdAt, id),
      id,
      actorUserId: input.actorUserId ?? "anonymous",
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata,
      createdAt,
      ttl,
    }),
  }))

  return { id, createdAt }
}

/**
 * Best-effort site audit write: never throws to callers.
 *
 * @param input - Event fields.
 * @param deps - Optional client/table overrides.
 */
export async function tryPutSiteAuditEvent(
  input: PutSiteAuditEventInput,
  deps: SiteAuditDeps = {},
): Promise<void> {
  try {
    await putSiteAuditEvent(input, deps)
  } catch (error) {
    console.error("[site-audit] PutItem failed", error)
  }
}

/**
 * Convenience: log an Ask Limetry chat turn under `site:{host}:assistant`.
 *
 * @param metadata - Chat payload fields.
 * @param deps - Optional overrides.
 */
export async function logAssistantChatEvent(
  metadata: Record<string, unknown>,
  deps: SiteAuditDeps = {},
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): Promise<void> {
  await tryPutSiteAuditEvent({
    tenantId: siteTenantId(resolveSiteAuditHost(env), "assistant"),
    action: "assistant.chat",
    resourceType: "assistant",
    metadata,
    retentionDays: resolveSiteAuditRetentionDays(env),
  }, deps)
}

/**
 * Convenience: log a contact-form submission under `site:{host}:contact`.
 *
 * @param metadata - Contact payload fields.
 * @param deps - Optional overrides.
 */
export async function logContactSubmitEvent(
  metadata: Record<string, unknown>,
  deps: SiteAuditDeps = {},
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): Promise<void> {
  await tryPutSiteAuditEvent({
    tenantId: siteTenantId(resolveSiteAuditHost(env), "contact"),
    action: "contact.submit",
    resourceType: "contact",
    metadata,
    retentionDays: resolveSiteAuditRetentionDays(env),
  }, deps)
}
