/**
 * Client-safe public site and product URLs for the limetry.org marketing site.
 *
 * `NEXT_PUBLIC_*` must be read as static `process.env.NEXT_PUBLIC_*` property
 * accesses so Next can inline them into the client bundle.
 */

import {
  CANONICAL_ORIGINS,
  type ResolvedOrigin,
  resolveWebOrigins,
  trimOrigin,
} from "./public-origins"

/**
 * Removes a trailing slash from a URL string.
 *
 * @param value - URL or origin.
 * @returns Value without trailing `/`.
 */
function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, "")
}

/**
 * Reads a public email from `process.env` with a fallback.
 *
 * @param name - Env var name.
 * @param fallback - Default address when unset.
 * @returns Trimmed email.
 */
function publicEmail(name: string, fallback: string): string {
  const raw = process.env[name]
  if (!raw || raw.trim().length === 0) {
    return fallback
  }
  return raw.trim()
}

/**
 * Picks env, canonical production, or local origin for client bundles.
 *
 * Dynamic `process.env[key]` lookups must not be used — Next will not inline them.
 *
 * @param envValue - Static `process.env.NEXT_PUBLIC_*` value.
 * @param canonical - Production canonical origin.
 * @param local - Local development origin.
 * @returns Absolute origin without trailing slash.
 */
function clientSafeOrigin(
  envValue: string | undefined,
  canonical: string,
  local: string,
): string {
  if (envValue && envValue.trim().length > 0) {
    return trimTrailingSlash(trimOrigin(envValue))
  }
  if (
    process.env.NODE_ENV === "production"
    || process.env.VERCEL
    || process.env.VERCEL_ENV
  ) {
    return trimTrailingSlash(canonical)
  }
  return trimTrailingSlash(local)
}

const LOCAL_WEB = "http://localhost:3800"
const LOCAL_APP = "http://localhost:3830"
const LOCAL_API = "http://localhost:3810"

/**
 * Client-inlined public URLs and contact emails for limetry.org.
 */
export const siteUrls = {
  web: clientSafeOrigin(
    process.env.NEXT_PUBLIC_WEB_URL,
    CANONICAL_ORIGINS.web,
    LOCAL_WEB,
  ),
  app: clientSafeOrigin(
    process.env.NEXT_PUBLIC_APP_URL,
    CANONICAL_ORIGINS.app,
    LOCAL_APP,
  ),
  api: clientSafeOrigin(
    process.env.NEXT_PUBLIC_API_URL,
    CANONICAL_ORIGINS.ossApi,
    LOCAL_API,
  ),
  github: trimTrailingSlash(process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/limetry/sdk"),
  discord: trimTrailingSlash(process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.gg/VxUWz7cZP"),
  contactEmail: publicEmail("NEXT_PUBLIC_CONTACT_EMAIL", "hello@limetry.org"),
  legalEmail: publicEmail("NEXT_PUBLIC_LEGAL_EMAIL", "legal@limetry.org"),
  privacyEmail: publicEmail("NEXT_PUBLIC_PRIVACY_EMAIL", "privacy@limetry.org"),
} as const

/**
 * Server/preflight origin resolution (full `process.env` object is fine here).
 *
 * @returns Resolved web, app, and API origins.
 */
export function serverOrigins(): {
  api: ResolvedOrigin
  app: ResolvedOrigin
  web: ResolvedOrigin
  } {
  return resolveWebOrigins()
}

/**
 * Joins a path onto the configured GitHub repository URL.
 *
 * @param path - Repo-relative path (with or without leading `/`).
 * @returns Absolute GitHub URL.
 */
export function githubPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${siteUrls.github}${normalized}`
}

/**
 * Builds a `mailto:` href.
 *
 * @param email - Email address.
 * @returns `mailto:` URL.
 */
export function mailto(email: string): string {
  return `mailto:${email}`
}
