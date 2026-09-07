/**
 * PostHog host normalization and `/decide` reachability probe.
 *
 * Matches setup-monitoring: POST `/decide/?v=3` with the project API key.
 * HTTP 404 (and any non-2xx) is a failure — `/_health` must not be used.
 */

import type { ConnectivityProbe, ProbeResult } from "../types.js"
import { DEFAULT_PROBE_TIMEOUT_MS } from "./http.js"

const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com"

/**
 * Normalizes a PostHog host URL (default US cloud).
 *
 * @param host - Optional host override; blank/undefined uses the US cloud default.
 * @returns Absolute host origin without a trailing slash.
 */
export function resolvePosthogHost(host: string | undefined): string {
  const raw = (host ?? DEFAULT_POSTHOG_HOST).trim()
  if (!raw) {
    return DEFAULT_POSTHOG_HOST
  }
  return raw.replace(/\/$/, "")
}

/**
 * POSTs to PostHog `/decide/?v=3` to verify the project key and host.
 *
 * @param input - API key, optional host, timeout.
 * @returns Probe result; non-2xx fails (including 404).
 */
export async function probePosthogDecide(input: {
  apiKey: string
  host?: string
  timeoutMs?: number
}): Promise<ProbeResult> {
  const started = Date.now()
  const origin = resolvePosthogHost(input.host)
  const timeoutMs = input.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS
  try {
    const response = await fetch(`${origin}/decide/?v=3`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: input.apiKey,
        distinct_id: "limetry-preflight",
      }),
      signal: AbortSignal.timeout(timeoutMs),
    })
    const elapsed = `${Date.now() - started}ms`
    if (response.ok) {
      return {
        ok: true,
        detail: `PostHog reachable (${elapsed}, HTTP ${response.status}).`,
      }
    }
    return {
      ok: false,
      detail: `PostHog unreachable (${elapsed}): HTTP ${response.status}`,
    }
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : "request failed"
    return {
      ok: false,
      detail: `PostHog unreachable (${Date.now() - started}ms): ${reason}`,
    }
  }
}

/**
 * Optional PostHog `/decide` reachability probe.
 *
 * @param input - API key, host override, and severity flags.
 * @returns Named `"posthog"` connectivity probe.
 */
export function createPosthogProbe(input: {
  apiKey: string
  host?: string
  required?: boolean
}): ConnectivityProbe {
  return {
    name: "posthog",
    required: input.required ?? false,
    critical: false,
    run: () => probePosthogDecide({
      apiKey: input.apiKey,
      host: input.host,
    }),
  }
}
