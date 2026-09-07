/**
 * HTTP reachability probes used by connectivity checks and vendor wrappers.
 */

import type { ConnectivityProbe, ProbeResult } from "../types.js"

/**
 * Default timeout for HTTP and store probes.
 */
export const DEFAULT_PROBE_TIMEOUT_MS = 5000

/**
 * Optional request headers for HTTP probes.
 */
export type HttpHeaders = Record<string, string>

/**
 * Formats elapsed milliseconds since `started` for probe detail suffixes.
 *
 * @param started - `Date.now()` captured at probe start.
 * @returns Elapsed duration string such as `"42ms"`.
 */
function elapsedSuffix(started: number): string {
  return `${Date.now() - started}ms`
}

/**
 * GET/HEAD-style probe that treats only 2xx as success.
 *
 * @param input - Target URL and success/failure detail templates.
 * @returns Probe result with elapsed timing in `detail`.
 */
export async function probeHttp(input: {
  failure: string
  headers?: HttpHeaders
  method?: string
  success: string
  timeoutMs?: number
  url: string
}): Promise<ProbeResult> {
  const started = Date.now()
  const timeoutMs = input.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS
  try {
    const response = await fetch(input.url, {
      method: input.method ?? "GET",
      headers: input.headers,
      signal: AbortSignal.timeout(timeoutMs),
    })
    const elapsed = elapsedSuffix(started)
    if (response.ok) {
      return {
        ok: true,
        detail: `${input.success} (${elapsed}).`,
      }
    }
    return {
      ok: false,
      detail: `${input.failure} (${elapsed}): HTTP ${response.status}`,
    }
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : "request failed"
    return {
      ok: false,
      detail: `${input.failure} (${elapsedSuffix(started)}): ${reason}`,
    }
  }
}

/**
 * Treats any HTTP response (including 4xx/5xx) as reachability. Network errors fail.
 *
 * @param input - Target URL and success/failure detail templates.
 * @returns Probe result with status code when reachable.
 */
export async function probeReachableOrigin(input: {
  failure: string
  headers?: HttpHeaders
  method?: string
  success: string
  timeoutMs?: number
  url: string
}): Promise<ProbeResult> {
  const started = Date.now()
  const timeoutMs = input.timeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS
  try {
    const response = await fetch(input.url, {
      method: input.method ?? "GET",
      headers: input.headers,
      signal: AbortSignal.timeout(timeoutMs),
    })
    return {
      ok: true,
      detail: `${input.success} (${elapsedSuffix(started)}, HTTP ${response.status}).`,
    }
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : "request failed"
    return {
      ok: false,
      detail: `${input.failure} (${elapsedSuffix(started)}): ${reason}`,
    }
  }
}

/**
 * Wraps {@link probeHttp} as a {@link ConnectivityProbe}, optionally retrying
 * transient failures (useful when a sibling process is still booting).
 *
 * @param input - Probe identity plus {@link probeHttp} options.
 * @returns Connectivity probe suitable for `runPreflight`.
 */
export function createHttpProbe(input: {
  critical?: boolean
  failure: string
  headers?: HttpHeaders
  method?: string
  name: string
  required: boolean
  retries?: number
  retryDelayMs?: number
  success: string
  timeoutMs?: number
  url: string
}): ConnectivityProbe {
  const retries = Math.max(0, input.retries ?? 0)
  const retryDelayMs = input.retryDelayMs ?? 400
  return {
    name: input.name,
    required: input.required,
    critical: input.critical,
    run: async () => {
      let last = await probeHttp(input)
      for (let attempt = 0; attempt < retries && !last.ok; attempt += 1) {
        await new Promise((resolve) => {
          setTimeout(resolve, retryDelayMs)
        })
        last = await probeHttp(input)
      }
      return last
    },
  }
}
