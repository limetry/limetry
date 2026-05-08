/**
 * Audit event append/list stores (in-memory and Postgres) for `\@limetry/server`.
 */

import { randomUUID } from "node:crypto"

import type { Pool } from "pg"

/**
 * Single audit log event.
 */
export type AuditEvent = {
  /**
   * Event id (UUID in-memory; bigint text from Postgres).
   */
  id: string
  /**
   * Tenant scope.
   */
  tenant_id: string
  /**
   * Event type (for example `policy.evaluated`, `action.recorded`).
   */
  event_type: string
  /**
   * Subject id (decision id, intent id, approval id, etc.).
   */
  subject_id: string
  /**
   * Redacted or forensics details payload.
   */
  details: Record<string, unknown>
  /**
   * ISO creation timestamp.
   */
  created_at: string
}

/**
 * Query options for {@link AuditStore.list}.
 */
export type AuditQuery = {
  /**
   * Page size (clamped 1–200; default 50).
   */
  limit?: number
  /**
   * Cursor event id for keyset pagination.
   */
  cursor?: string
  /**
   * Optional event_type filter.
   */
  event_type?: string
  /**
   * Optional agent_id filter against details or nested intent.
   */
  agent_id?: string
}

/**
 * Paginated audit list response.
 */
export type AuditListResult = {
  /**
   * Page of events (newest first).
   */
  events: AuditEvent[]
  /**
   * Cursor for the next page when more rows exist.
   */
  next_cursor?: string
}

/**
 * Input for appending an audit event.
 */
export type AppendAuditInput = {
  /**
   * Tenant id.
   */
  tenant_id: string
  /**
   * Event type string.
   */
  event_type: string
  /**
   * Subject id.
   */
  subject_id: string
  /**
   * Details object.
   */
  details: Record<string, unknown>
}

/**
 * Port for audit persistence.
 */
export interface AuditStore {
  /**
   * Appends an audit event.
   *
   * @param input - Event fields.
   * @returns Persisted event with id and timestamp.
   */
  append(input: AppendAuditInput): Promise<AuditEvent>
  /**
   * Lists events for a tenant with optional filters and cursor pagination.
   *
   * @param tenantId - Tenant scope.
   * @param query - List filters.
   * @returns Page of events and optional next cursor.
   */
  list(tenantId: string, query: AuditQuery): Promise<AuditListResult>
}

/**
 * Clamps list limit to the inclusive range `[1, 200]` with default 50.
 *
 * @param limit - Requested limit.
 * @returns Normalized limit.
 */
function normalizeLimit(limit: number | undefined): number {
  if (!limit || limit < 1) {
    return 50
  }
  return Math.min(limit, 200)
}

/**
 * Returns whether audit details match an agent_id filter.
 *
 * @param details - Event details object.
 * @param agentId - Agent id to match.
 * @returns `true` when top-level or nested intent agent matches.
 */
function matchesAgentFilter(details: Record<string, unknown>, agentId: string): boolean {
  if (details.agent_id === agentId) {
    return true
  }
  const intent = details.intent
  if (typeof intent === "object" && intent !== null && "agent_id" in intent) {
    return (intent as { agent_id: string }).agent_id === agentId
  }
  return false
}

/**
 * Process-local audit store (not durable across restarts).
 */
export class InMemoryAuditStore implements AuditStore {
  private readonly events: AuditEvent[] = []

  /**
   * Appends an event to the in-memory list.
   *
   * @param input - Event fields.
   * @returns Persisted event.
   */
  async append(input: AppendAuditInput): Promise<AuditEvent> {
    const event: AuditEvent = {
      id: randomUUID(),
      tenant_id: input.tenant_id,
      event_type: input.event_type,
      subject_id: input.subject_id,
      details: input.details,
      created_at: new Date().toISOString(),
    }
    this.events.push(event)
    return event
  }

  /**
   * Lists filtered events newest-first with cursor pagination.
   *
   * @param tenantId - Tenant scope.
   * @param query - Filters and pagination.
   * @returns Page result.
   */
  async list(tenantId: string, query: AuditQuery): Promise<AuditListResult> {
    const limit = normalizeLimit(query.limit)
    let filtered = this.events
      .filter((event) => event.tenant_id === tenantId)
      .filter((event) => !query.event_type || event.event_type === query.event_type)
      .filter((event) => !query.agent_id || matchesAgentFilter(event.details, query.agent_id))
      .sort((left, right) => right.created_at.localeCompare(left.created_at))

    if (query.cursor) {
      const cursorIndex = filtered.findIndex((event) => event.id === query.cursor)
      if (cursorIndex >= 0) {
        filtered = filtered.slice(cursorIndex + 1)
      }
    }

    const page = filtered.slice(0, limit)
    const next_cursor = filtered.length > limit ? page[page.length - 1]?.id : undefined

    return {
      events: page,
      next_cursor,
    }
  }
}

/**
 * Postgres-backed audit store writing to `limetry_audit_log`.
 */
export class PostgresAuditStore implements AuditStore {
  /**
   * @param pool - Shared `pg` pool.
   */
  constructor(private readonly pool: Pool) {}

  /**
   * Inserts an audit row and returns the persisted event.
   *
   * @param input - Event fields.
   * @returns Persisted event.
   * @throws When the SQL insert fails.
   */
  async append(input: AppendAuditInput): Promise<AuditEvent> {
    const createdAt = new Date()
    const result = await this.pool.query<{
      id: string
      created_at: Date
    }>(
      `INSERT INTO limetry_audit_log (
         tenant_id, event_type, subject_id, details, created_at
       )
       VALUES ($1, $2, $3, $4::jsonb, $5)
       RETURNING id::text, created_at`,
      [
        input.tenant_id,
        input.event_type,
        input.subject_id,
        JSON.stringify(input.details),
        createdAt,
      ],
    )
    const row = result.rows[0]

    return {
      id: row?.id ?? randomUUID(),
      tenant_id: input.tenant_id,
      event_type: input.event_type,
      subject_id: input.subject_id,
      details: input.details,
      created_at: (row?.created_at ?? createdAt).toISOString(),
    }
  }

  /**
   * Lists audit rows with keyset pagination on descending `id`.
   *
   * @param tenantId - Tenant scope.
   * @param query - Filters and pagination.
   * @returns Page result.
   * @throws When the SQL query fails.
   */
  async list(tenantId: string, query: AuditQuery): Promise<AuditListResult> {
    const limit = normalizeLimit(query.limit)
    const params: unknown[] = [tenantId]
    let sql = `
      SELECT id::text, tenant_id, event_type, subject_id, details, created_at
      FROM limetry_audit_log
      WHERE tenant_id = $1
    `

    if (query.event_type) {
      params.push(query.event_type)
      sql += ` AND event_type = $${params.length}`
    }

    if (query.cursor) {
      params.push(query.cursor)
      sql += ` AND id < $${params.length}::bigint`
    }

    if (query.agent_id) {
      params.push(query.agent_id)
      sql += ` AND (
        details->>'agent_id' = $${params.length}
        OR details->'intent'->>'agent_id' = $${params.length}
      )`
    }

    params.push(limit + 1)
    sql += ` ORDER BY id DESC LIMIT $${params.length}`

    const result = await this.pool.query<{
      id: string
      tenant_id: string
      event_type: string
      subject_id: string
      details: Record<string, unknown>
      created_at: Date
    }>(sql, params)

    const rows = result.rows
    const hasMore = rows.length > limit
    const page = hasMore ? rows.slice(0, limit) : rows

    return {
      events: page.map((row) => ({
        id: row.id,
        tenant_id: row.tenant_id,
        event_type: row.event_type,
        subject_id: row.subject_id,
        details: row.details,
        created_at: row.created_at.toISOString(),
      })),
      next_cursor: hasMore ? page[page.length - 1]?.id : undefined,
    }
  }
}
