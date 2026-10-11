/**
 * Canonical Limetry product origins for OSS and Cloud.
 *
 * Published npm packages resolve API calls to these hosts when
 * `LIMETRY_BASE_URL` is unset.
 */

/**
 * Production origins for the OSS evaluate API and limetry.org website.
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
  api: "https://api.limetry.com",
  app: "https://app.limetry.com",
  ossApi: "https://api.limetry.com",
} as const

/**
 * Default Limetry evaluate API for OSS npm packages and adapters.
 */
export const DEFAULT_LIMETRY_BASE_URL = LIMETRY_OSS_ORIGINS.api

/**
 * Default Limetry Cloud BFF for organization workspaces (`app.limetry.com` agents).
 */
export const DEFAULT_LIMETRY_CLOUD_BASE_URL = LIMETRY_CLOUD_ORIGINS.api

/**
 * Limetry Cloud portal origin (sign-up, tokens, billing).
 */
export const LIMETRY_CLOUD_APP_ORIGIN = LIMETRY_CLOUD_ORIGINS.app

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

/**
 * Resolves the Limetry Cloud BFF base URL from env or production default.
 *
 * @param source - Environment map; defaults to `process.env`.
 * @param override - Explicit base URL that wins over env.
 * @returns Origin without a trailing slash.
 */
export function resolveLimetryCloudBaseUrl(
  source: NodeJS.ProcessEnv = process.env,
  override?: string,
): string {
  const trimmedOverride = override?.trim()
  const trimmedEnv =
    source.LIMETRY_CLOUD_BASE_URL?.trim()
    ?? source.NEXT_PUBLIC_HOSTED_API_URL?.trim()
    ?? source.HOSTED_PUBLIC_API_URL?.trim()
  const raw =
    (trimmedOverride && trimmedOverride.length > 0 ? trimmedOverride : undefined)
    ?? (trimmedEnv && trimmedEnv.length > 0 ? trimmedEnv : undefined)
    ?? DEFAULT_LIMETRY_CLOUD_BASE_URL
  return raw.replace(/\/$/, "")
}
