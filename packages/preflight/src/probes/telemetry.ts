/**
 * Collects optional Sentry/PostHog env checks and probes from an injected env bag.
 */

import { envCheck } from "../checks.js"
import { annotated } from "../dotenv-files.js"
import type { ConnectivityProbe, PreflightCheck } from "../types.js"
import { createPosthogProbe } from "./posthog.js"
import { createSentryProbe, parseSentryDsn } from "./sentry.js"

/**
 * First non-empty value among `keys` on the injected env bag.
 *
 * @param source - Injected env bag.
 * @param keys - Candidate env key names in priority order.
 * @returns Trimmed first non-empty value, or `undefined`.
 */
function firstEnv(source: NodeJS.ProcessEnv, keys: string[]): string | undefined {
  for (const key of keys) {
    const raw = source[key]
    if (raw && raw.trim().length > 0) {
      return raw.trim()
    }
  }
  return undefined
}

const SENTRY_KEYS = ["SENTRY_DSN", "NEXT_PUBLIC_SENTRY_DSN"]
const POSTHOG_KEY_KEYS = [
  "POSTHOG_KEY",
  "POSTHOG_API_KEY",
  "NEXT_PUBLIC_POSTHOG_KEY",
  "NEXT_PUBLIC_POSTHOG_PROJECT_API_KEY",
]
const POSTHOG_HOST_KEYS = ["POSTHOG_HOST", "NEXT_PUBLIC_POSTHOG_HOST", "POSTHOG_API_HOST"]

/**
 * Env checks, context lines, and probes for optional observability backends.
 */
export type TelemetryBundle = {
  /**
   * Non-pass/fail context lines (e.g. annotated PostHog host).
   */
  configuration: string[]
  /**
   * Optional secret/env checks for configured backends.
   */
  envChecks: PreflightCheck[]
  /**
   * Optional connectivity probes; never critical for startup.
   */
  probes: ConnectivityProbe[]
}

/**
 * Adds Sentry/PostHog env display and optional connectivity when those keys are set
 * on `source`. Observability never blocks startup.
 *
 * @param source - Injected env bag; do not rely on ambient `process.env` inside callers.
 * @returns Bundle of env checks, context lines, and probes to merge into `runPreflight`.
 */
export function collectConfiguredTelemetry(
  source: NodeJS.ProcessEnv = process.env,
): TelemetryBundle {
  const envChecks: PreflightCheck[] = []
  const configuration: string[] = []
  const probes: ConnectivityProbe[] = []

  const sentryDsn = firstEnv(source, SENTRY_KEYS)
  if (sentryDsn) {
    const parsed = parseSentryDsn(sentryDsn)
    envChecks.push(envCheck({
      name: "SENTRY_DSN",
      value: sentryDsn,
      secret: true,
      ok: Boolean(parsed),
      required: false,
      critical: false,
    }))
    const sentryProbe = createSentryProbe({ dsn: sentryDsn, required: false })
    if (sentryProbe) {
      probes.push(sentryProbe)
    }
  }

  const posthogKey = firstEnv(source, POSTHOG_KEY_KEYS)
  if (posthogKey) {
    envChecks.push(envCheck({
      name: "POSTHOG_KEY",
      value: posthogKey,
      secret: true,
      ok: true,
      required: false,
      critical: false,
    }))
    const host = firstEnv(source, POSTHOG_HOST_KEYS)
    if (host) {
      configuration.push(`POSTHOG_HOST: ${annotated("POSTHOG_HOST", host, source)}`)
    }
    probes.push(createPosthogProbe({ apiKey: posthogKey, host, required: false }))
  }

  return { envChecks, configuration, probes }
}
