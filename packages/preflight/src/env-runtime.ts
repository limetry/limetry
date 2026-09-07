/**
 * Runtime/deployment flags read from an injected env bag.
 *
 * Always pass `source` from the caller. Defaulting to `process.env` is only for
 * call-site convenience — do not re-read `process.env` inside these helpers.
 */

/**
 * True in Vitest / `NODE_ENV=test` (connectivity usually skipped).
 *
 * @param source - Injected env bag.
 * @returns Whether the process is a test runtime.
 */
export function isTestEnv(source: NodeJS.ProcessEnv = process.env): boolean {
  return source.NODE_ENV === "test" || source.VITEST === "true"
}

/**
 * True during Next production build/export or Limetry static portal export.
 *
 * @param source - Injected env bag (`LIMETRY_STATIC_EXPORT`, `NEXT_PHASE`).
 * @returns Whether connectivity and fail-hard should be suppressed for build.
 */
export function isNextBuildPhase(source: NodeJS.ProcessEnv = process.env): boolean {
  if (source.LIMETRY_STATIC_EXPORT === "1") {
    return true
  }
  const phase = source.NEXT_PHASE
  return phase === "phase-production-build" || phase === "phase-export"
}

/**
 * True when the process is a production runtime (Node or Vercel Production).
 *
 * @param source - Injected env bag (`NODE_ENV`, `VERCEL_ENV`).
 * @returns Whether production fail-hard policy should apply.
 */
export function isProductionRuntime(source: NodeJS.ProcessEnv = process.env): boolean {
  return source.NODE_ENV === "production" || source.VERCEL_ENV === "production"
}

/**
 * Whether connectivity probes should run for this env bag.
 *
 * @param source - Injected env bag.
 * @returns `false` in test or Next build/export phases; otherwise `true`.
 */
export function shouldProbeConnectivity(source: NodeJS.ProcessEnv = process.env): boolean {
  return !isTestEnv(source) && !isNextBuildPhase(source)
}

/**
 * Hard-fail only when a required check is actually blocking a live process.
 * Preview/build/test must still boot with warnings.
 *
 * @param source - Injected env bag.
 * @returns `true` only for production runtimes outside test/build phases.
 */
export function shouldFailHard(source: NodeJS.ProcessEnv = process.env): boolean {
  if (isTestEnv(source) || isNextBuildPhase(source)) {
    return false
  }
  return isProductionRuntime(source)
}
