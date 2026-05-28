/**
 * Optional Sentry / PostHog bootstrap for `\@limetry/server` (Node / Lambda).
 */

import * as Sentry from "@sentry/node"
import { PostHog } from "posthog-node"

let sentryInitialized = false
let posthogClient: PostHog | undefined

/**
 * Initializes Sentry and PostHog from process env when keys are present.
 *
 * Safe to call multiple times; subsequent calls are no-ops.
 *
 * @param source - Env bag; defaults to `process.env`.
 * @returns Nothing.
 */
export function initServerTelemetry(source: NodeJS.ProcessEnv = process.env): void {
  const sentryDsn = source.SENTRY_DSN?.trim()
  if (sentryDsn && !sentryInitialized) {
    Sentry.init({
      dsn: sentryDsn,
      tracesSampleRate: 0.1,
    })
    sentryInitialized = true
  }

  const posthogKey = (
    source.POSTHOG_KEY
    ?? source.POSTHOG_API_KEY
    ?? source.NEXT_PUBLIC_POSTHOG_KEY
  )?.trim()
  if (posthogKey && !posthogClient) {
    posthogClient = new PostHog(posthogKey, {
      host: source.POSTHOG_HOST ?? source.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    })
  }
}

/**
 * Returns the shared PostHog Node client when configured.
 *
 * @returns PostHog client or `undefined`.
 */
export function getPosthogClient(): PostHog | undefined {
  return posthogClient
}
