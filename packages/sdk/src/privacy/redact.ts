/**
 * Privacy helpers for scrubbing secrets from intents and building audit projections.
 *
 * Used when persisting authorization requests/responses and `policy.evaluated` /
 * `action.recorded` audit detail blobs so raw credentials are never stored.
 */

import type { ActionIntent } from "../types.js"

/**
 * Audit retention modes for ActionPolicy.
 * - minimal: store decision projection only (default)
 * - forensics: store redacted intent + details after secret scrubbing
 */
export type AuditMode = "minimal" | "forensics"

/**
 * Default audit retention mode when a policy or env override is absent.
 */
export const DEFAULT_AUDIT_MODE: AuditMode = "minimal"

/**
 * Case-insensitive pattern matching common secret / credential key names.
 */
const SENSITIVE_KEY_PATTERN =
  /pass(word|wd)?|secret|token|api[_-]?key|authorization|auth|cookie|credential|private[_-]?key|access[_-]?key|refresh|bearer|ssn|credit[_-]?card|cvv|session/i

/**
 * Replacement string written in place of redacted secret values.
 */
const REDACTED = "[REDACTED]"

/**
 * Returns whether a metadata/details key name looks like a secret or credential.
 *
 * @param key - Object key to test.
 * @returns `true` when the key name matches known secret/credential patterns.
 */
export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key)
}

/**
 * Strips query string, hash, and URL userinfo from a resource identifier.
 *
 * Non-URL resources are returned unchanged after trimming; if a `?` is present
 * on a non-URL string, only the prefix before the query is kept.
 *
 * @param resource - Resource identifier (URL or opaque string).
 * @returns Scrubbed resource string.
 */
export function scrubResource(resource: string): string {
  const trimmed = resource.trim()
  if (trimmed.length === 0) {
    return trimmed
  }

  try {
    const url = new URL(trimmed)
    url.username = ""
    url.password = ""
    url.search = ""
    url.hash = ""
    return url.toString()
  } catch {
    const queryIndex = trimmed.indexOf("?")
    if (queryIndex >= 0) {
      return trimmed.slice(0, queryIndex)
    }
    return trimmed
  }
}

/**
 * Drops or redacts sensitive keys from a string metadata map.
 *
 * Sensitive keys keep their key but get value `"[REDACTED]"`; other values
 * pass through {@link scrubEmbeddedSecrets}. Returns `undefined` for empty
 * or missing input.
 *
 * @param metadata - Optional string key/value metadata bag.
 * @returns Redacted metadata, or `undefined` when empty/absent.
 */
export function redactMetadata(
  metadata: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!metadata) {
    return undefined
  }

  const next: Record<string, string> = {}
  for (const [key, value] of Object.entries(metadata)) {
    if (isSensitiveKey(key)) {
      next[key] = REDACTED
      continue
    }
    next[key] = scrubEmbeddedSecrets(value)
  }
  return Object.keys(next).length > 0 ? next : undefined
}

/**
 * Recursively redacts sensitive keys and scrubs string values in open JSON bags.
 *
 * @param details - Optional open JSON object.
 * @returns Redacted deep copy, or `undefined` when input is absent.
 */
export function redactDetails(
  details: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!details) {
    return undefined
  }
  return redactUnknownRecord(details)
}

/**
 * Redacts every entry in a plain object, replacing sensitive keys with `"[REDACTED]"`.
 *
 * @param value - Plain object to redact.
 * @returns New object with redacted children.
 */
function redactUnknownRecord(value: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = {}
  for (const [key, child] of Object.entries(value)) {
    if (isSensitiveKey(key)) {
      next[key] = REDACTED
      continue
    }
    next[key] = redactUnknownValue(child)
  }
  return next
}

/**
 * Redacts a single JSON value (string, array, object, or primitive).
 *
 * @param value - Value to scrub.
 * @returns Scrubbed value of the same structural shape.
 */
function redactUnknownValue(value: unknown): unknown {
  if (typeof value === "string") {
    return scrubEmbeddedSecrets(value)
  }
  if (Array.isArray(value)) {
    return value.map((entry) => redactUnknownValue(entry))
  }
  if (value && typeof value === "object") {
    return redactUnknownRecord(value as Record<string, unknown>)
  }
  return value
}

/**
 * Redacts common secret patterns embedded in free-text / URL query values.
 *
 * Replaces query param values for token-like keys, Bearer tokens, and
 * `sk_live` / `sk_test` style secret key literals.
 *
 * @param value - Free-text string that may embed secrets.
 * @returns String with matched secret substrings replaced by `"[REDACTED]"`.
 */
export function scrubEmbeddedSecrets(value: string): string {
  let next = value
  next = next.replace(
    /([?&](?:access_token|api_key|token|key|secret|password|auth)=)([^&#]*)/gi,
    `$1${REDACTED}`,
  )
  next = next.replace(
    /\b(Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi,
    `$1${REDACTED}`,
  )
  next = next.replace(
    /\b(sk[-_](?:live|test)[-_][A-Za-z0-9]+)/g,
    REDACTED,
  )
  return next
}

/**
 * Returns an {@link ActionIntent} safe to log or forward after secret scrubbing.
 *
 * Resource query strings are removed; sensitive metadata keys are redacted.
 *
 * @param intent - Original action intent.
 * @returns Shallow copy with scrubbed `resource` and redacted `metadata`.
 */
export function redactActionIntent(intent: ActionIntent): ActionIntent {
  return {
    ...intent,
    resource: scrubResource(intent.resource),
    metadata: redactMetadata(intent.metadata),
  }
}

/**
 * Intent fields retained in audit / authorization projections after scrubbing.
 */
export type AuditIntentProjection = {
  /**
   * Intent identifier.
   */
  intent_id: string
  /**
   * Policy identifier.
   */
  policy_id: string
  /**
   * Agent identifier.
   */
  agent_id: string
  /**
   * Action type string.
   */
  action_type: string
  /**
   * Scrubbed resource identifier.
   */
  resource: string
  /**
   * Optional cost object (unchanged; not secret-scrubbed beyond intent redaction).
   */
  cost?: ActionIntent["cost"]
  /**
   * Issue timestamp (ISO-8601).
   */
  issued_at: string
  /**
   * Redacted metadata; present only in `forensics` mode projections.
   */
  metadata?: Record<string, string>
}

/**
 * Builds the intent payload stored in audit / authorization rows.
 *
 * `minimal` drops metadata; `forensics` keeps redacted metadata.
 *
 * @param intent - Original action intent.
 * @param mode - Audit retention mode; defaults to {@link DEFAULT_AUDIT_MODE}.
 * @returns Projection suitable for persistence.
 */
export function projectIntentForAudit(
  intent: ActionIntent,
  mode: AuditMode = DEFAULT_AUDIT_MODE,
): AuditIntentProjection {
  const redacted = redactActionIntent(intent)
  if (mode === "forensics") {
    return {
      intent_id: redacted.intent_id,
      policy_id: redacted.policy_id,
      agent_id: redacted.agent_id,
      action_type: redacted.action_type,
      resource: redacted.resource,
      cost: redacted.cost,
      issued_at: redacted.issued_at,
      metadata: redacted.metadata,
    }
  }

  return {
    intent_id: redacted.intent_id,
    policy_id: redacted.policy_id,
    agent_id: redacted.agent_id,
    action_type: redacted.action_type,
    resource: redacted.resource,
    cost: redacted.cost,
    issued_at: redacted.issued_at,
  }
}

/**
 * Inputs for {@link buildEvaluatedAuditDetails}.
 */
export type EvaluatedAuditDetailsInput = {
  /**
   * Whether the policy evaluation approved the intent.
   */
  approved: boolean
  /**
   * Human-readable decision reasons.
   */
  reasons: string[]
  /**
   * Policy identifier under evaluation.
   */
  policy_id: string
  /**
   * Intent being audited.
   */
  intent: ActionIntent
  /**
   * Optional audit mode; defaults to {@link DEFAULT_AUDIT_MODE}.
   */
  mode?: AuditMode
  /**
   * When true, adds `legacy: true` to the details blob.
   */
  legacy?: boolean
}

/**
 * Builds the details blob for `policy.evaluated` audit events.
 *
 * @param input - Approval result, policy id, intent, and optional mode/legacy flags.
 * @returns JSON-serializable audit details object.
 */
export function buildEvaluatedAuditDetails(
  input: EvaluatedAuditDetailsInput,
): Record<string, unknown> {
  const mode = input.mode ?? DEFAULT_AUDIT_MODE
  const projected = projectIntentForAudit(input.intent, mode)
  return {
    approved: input.approved,
    reasons: input.reasons,
    policy_id: input.policy_id,
    agent_id: projected.agent_id,
    action_type: projected.action_type,
    resource: projected.resource,
    audit_mode: mode,
    intent: projected,
    ...(input.legacy ? { legacy: true } : {}),
  }
}

/**
 * Inputs for {@link buildRecordedAuditDetails}.
 */
export type RecordedAuditDetailsInput = {
  /**
   * Recording outcome for the action.
   */
  outcome: "executed" | "skipped" | "blocked"
  /**
   * Correlated decision id, if any.
   */
  decision_id?: string | null
  /**
   * Intent being audited.
   */
  intent: ActionIntent
  /**
   * Optional open JSON details; included (redacted) only in `forensics` mode.
   */
  details?: Record<string, unknown>
  /**
   * Optional audit mode; defaults to {@link DEFAULT_AUDIT_MODE}.
   */
  mode?: AuditMode
}

/**
 * Builds the details blob for `action.recorded` audit events.
 *
 * In `forensics` mode, includes a redacted `details` object (empty object when
 * absent). In `minimal` mode, omits the `details` field.
 *
 * @param input - Outcome, intent, and optional decision id / details / mode.
 * @returns JSON-serializable audit details object.
 */
export function buildRecordedAuditDetails(
  input: RecordedAuditDetailsInput,
): Record<string, unknown> {
  const mode = input.mode ?? DEFAULT_AUDIT_MODE
  const projected = projectIntentForAudit(input.intent, mode)
  const base: Record<string, unknown> = {
    outcome: input.outcome,
    decision_id: input.decision_id ?? null,
    agent_id: projected.agent_id,
    action_type: projected.action_type,
    resource: projected.resource,
    audit_mode: mode,
    intent: projected,
  }

  if (mode === "forensics") {
    base.details = redactDetails(input.details) ?? {}
  }

  return base
}

/**
 * Resolves audit mode from a policy document or environment default.
 *
 * Prefers a valid `policy.audit_mode`, then a valid `envDefault`, otherwise
 * {@link DEFAULT_AUDIT_MODE}.
 *
 * @param policy - Policy-like object that may carry `audit_mode`, or nullish.
 * @param envDefault - Optional environment default string.
 * @returns Resolved {@link AuditMode}.
 */
export function resolveAuditMode(
  policy: { audit_mode?: AuditMode | string | null } | null | undefined,
  envDefault?: string | null,
): AuditMode {
  const fromPolicy = policy?.audit_mode
  if (fromPolicy === "minimal" || fromPolicy === "forensics") {
    return fromPolicy
  }
  if (envDefault === "minimal" || envDefault === "forensics") {
    return envDefault
  }
  return DEFAULT_AUDIT_MODE
}

/**
 * Builds a minimized authorization request projection for Cloud persistence.
 *
 * Keeps a digest of the original intent; never stores raw secrets.
 *
 * @param input - Tenant/policy ids, intent, digest hex, and optional audit mode.
 * @returns JSON-serializable authorization request projection.
 */
export function buildMinimizedAuthorizationRequest(input: {
  /**
   * Tenant identifier.
   */
  tenantId: string
  /**
   * Policy identifier.
   */
  policyId: string
  /**
   * Intent to project into the request.
   */
  intent: ActionIntent
  /**
   * Hex digest of the original intent for correlation without storing secrets.
   */
  intentDigestHex: string
  /**
   * Optional audit mode; defaults to {@link DEFAULT_AUDIT_MODE}.
   */
  mode?: AuditMode
}): Record<string, unknown> {
  const mode = input.mode ?? DEFAULT_AUDIT_MODE
  return {
    tenant_id: input.tenantId,
    policy_id: input.policyId,
    intent_digest_hex: input.intentDigestHex,
    audit_mode: mode,
    intent: projectIntentForAudit(input.intent, mode),
  }
}

/**
 * Builds a minimized authorization response projection for Cloud persistence.
 *
 * @param input - Decision, reasons, digests, and optional ids / receipt / expiry.
 * @returns JSON-serializable authorization response projection.
 */
export function buildMinimizedAuthorizationResponse(input: {
  /**
   * Final authorization decision.
   */
  decision: "allow" | "deny"
  /**
   * Human-readable decision reasons.
   */
  reasons: string[]
  /**
   * Optional stable decision identifier.
   */
  decisionId?: string
  /**
   * Optional authorization row identifier.
   */
  authorizationId?: string
  /**
   * Hex digest of the original intent.
   */
  intentDigestHex: string
  /**
   * Optional authorization expiry (ISO-8601), or null.
   */
  expiresAt?: string | null
  /**
   * Optional opaque decision receipt from the engine.
   */
  decisionReceipt?: unknown
}): Record<string, unknown> {
  return {
    decision: input.decision,
    reasons: input.reasons,
    decision_id: input.decisionId ?? null,
    authorization_id: input.authorizationId ?? null,
    intent_digest_hex: input.intentDigestHex,
    expires_at: input.expiresAt ?? null,
    decision_receipt: input.decisionReceipt ?? null,
  }
}
