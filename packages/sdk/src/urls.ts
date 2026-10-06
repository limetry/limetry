/**
 * Canonical Limetry product origins for OSS and Cloud.
 *
 * Published npm packages resolve API calls to these hosts when
 * `LIMETRY_BASE_URL` is unset.
 */

/**
 * Production origins for the open-source product (limetry.org).
 */
export const LIMETRY_OSS_ORIGINS = {
  web: "https://limetry.org",
  api: "https://api.limetry.org",
  app: "https://app.limetry.com",
} as const

/**
 * Production origins for Limetry Cloud (limetry.com).
 */
export const LIMETRY_CLOUD_ORIGINS = {
  web: "https://limetry.com",
  api: "https://api.app.limetry.com",
  app: "https://app.limetry.com",
  ossApi: "https://api.limetry.org",
} as const

/**
 * Default Limetry evaluate API for OSS npm packages and adapters.
 */
export const DEFAULT_LIMETRY_BASE_URL = LIMETRY_OSS_ORIGINS.api

/**
 * Resolves the Limetry API base URL from env or OSS production default.
 *
 * @param source - Environment map; defaults to `process.env`.
 * @param override - Explicit base URL that wins over env.
 * @returns Origin without a trailing slash.
 */
export function resolveLimetryBaseUrl(
  source: NodeJS.ProcessEnv = process.env,
  override?: string,
): string {
  const trimmedOverride = override?.trim()
  const trimmedEnv = source.LIMETRY_BASE_URL?.trim()
  const raw =
    (trimmedOverride && trimmedOverride.length > 0 ? trimmedOverride : undefined)
    ?? (trimmedEnv && trimmedEnv.length > 0 ? trimmedEnv : undefined)
    ?? DEFAULT_LIMETRY_BASE_URL
  return raw.replace(/\/$/, "")
}
