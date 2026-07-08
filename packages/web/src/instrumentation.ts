/**
 * Next.js instrumentation entry for `\@limetry/web`.
 *
 * Preflight runs from `next.config.ts` in a child process so webpack never
 * bundles Node builtins into the web app graph.
 */

/**
 * Registers Next.js instrumentation hooks. Intentionally empty; preflight is
 * owned by `next.config.ts`.
 *
 * @returns Resolves when registration completes.
 */
import * as Sentry from "@sentry/nextjs"

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config")
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config")
  }
}

export const onRequestError = Sentry.captureRequestError
