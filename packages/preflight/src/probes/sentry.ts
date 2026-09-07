/**
 * Sentry DSN parsing and ingest-envelope reachability probe.
 *
 * Probes the project envelope endpoint using only the DSN public key
 * (no org auth token). Matches setup-monitoring / web-disruptdev: POST the
 * envelope URL. A minimal body (`{}\\n`) returns HTTP 200; empty bodies often
 * return 400/401. HTTP 404 is always a failure.
 */

import type { ConnectivityProbe, ProbeResult } from "../types.js"
import { DEFAULT_PROBE_TIMEOUT_MS } from "./http.js"

/**
 * Minimal envelope body that Sentry ingest accepts with HTTP 200.
 *
 * Empty bodies return 400/401; this avoids looking like a failed check without
 * requiring an org API token or sending a full event payload.
 */
const MINIMAL_ENVELOPE_BODY = "{}\n"

/**
 * Extracts ingest origin + project id from a Sentry DSN, or `null` if invalid.
 *
 * @param dsn - Sentry DSN URL string.
 * @returns Origin and project id when the DSN has a username and project path segment.
 */
export function parseSentryDsn(dsn: string): { origin: string; projectId: string; publicKey: string } | null {
  try {
    const parsed = new URL(dsn)
    const projectId = parsed.pathname.split("/").filter(Boolean).at(-1)
    if (!parsed.username || !projectId) {
      return null
    }
    return {
      origin: parsed.origin,
      projectId,
      publicKey: parsed.username,
    }
  } catch {
    return null
  }
}

/**
 * Builds the Sentry ingest envelope URL for a DSN.
 *
 * @param dsn - Sentry DSN URL string.
 * @returns Envelope URL, or `null` when the DSN is invalid.
 */
export function sentryEnvelopeUrl(dsn: string): string | null {
  const parsed = parseSentryDsn(dsn)
  if (!parsed) {
    return null
  }
  return `${parsed.origin}/api/${parsed.projectId}/envelope/`
}

/**
 * Returns true when an envelope response proves ingest is reachable.
 *
 * Accepts 2xx–4xx except 404 (wrong project / missing route). Rejects 5xx and
 * network errors. Prefer HTTP 200 via {@link MINIMAL_ENVELOPE_BODY}.
 *
 * @param status - HTTP status from the envelope POST.
 * @returns Whether the status counts as reachable.
 */
export function isSentryIngestReachableStatus(status: number): boolean {
  return status >= 200 && status < 500 && status !== 404
}

/**
 * POSTs a minimal envelope to verify ingest is reachable (DSN public key only).
 *
 * @param dsn - Sentry DSN used to derive the envelope URL and auth header.
 * @param timeoutMs - Abort timeout.
 * @returns Probe result; 404 and 5xx fail.
 */
export async function probeSentryIngest(
  dsn: string,
  timeoutMs = DEFAULT_PROBE_TIMEOUT_MS,
): Promise<ProbeResult> {
  const started = Date.now()
  const parsed = parseSentryDsn(dsn)
  const url = parsed ? `${parsed.origin}/api/${parsed.projectId}/envelope/` : null
  if (!parsed || !url) {
    return {
      ok: false,
      detail: "Sentry unreachable: invalid DSN",
    }
  }
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7,sentry_client=limetry-preflight/1.0,sentry_key=${parsed.publicKey}`,
      },
      body: MINIMAL_ENVELOPE_BODY,
      signal: AbortSignal.timeout(timeoutMs),
    })
    const elapsed = `${Date.now() - started}ms`
    if (isSentryIngestReachableStatus(response.status)) {
      return {
        ok: true,
        detail: `Sentry reachable (${elapsed}, HTTP ${response.status}).`,
      }
    }
    return {
      ok: false,
      detail: `Sentry unreachable (${elapsed}): HTTP ${response.status}`,
    }
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : "request failed"
    return {
      ok: false,
      detail: `Sentry unreachable (${Date.now() - started}ms): ${reason}`,
    }
  }
}

/**
 * Optional Sentry reachability probe from a DSN. Returns `null` when DSN is invalid.
 *
 * @param input - DSN and optional required flag.
 * @returns Named `"sentry"` probe, or `null` when the DSN cannot be parsed.
 */
export function createSentryProbe(input: {
  dsn: string
  required?: boolean
}): ConnectivityProbe | null {
  const parsed = parseSentryDsn(input.dsn)
  if (!parsed) {
    return null
  }
  return {
    name: "sentry",
    required: input.required ?? false,
    critical: false,
    run: () => probeSentryIngest(input.dsn),
  }
}
