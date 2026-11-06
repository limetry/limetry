/**
 * Client-safe public site and product URLs for the limetry.org marketing site.
 *
 * `NEXT_PUBLIC_*` must be read as static `process.env.NEXT_PUBLIC_*` property
 * accesses so Next can inline them into the client bundle.
 */

import { LIMETRY_CLOUD_ORIGINS } from "@limetry/sdk"

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
 * Returns true when a URL hostname is loopback.
 *
 * @param value - Absolute URL string.
 * @returns Whether the host is localhost / 127.0.0.1 / ::1.
 */
function isLoopbackOrigin(value: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase()
    return host === "localhost"
      || host === "127.0.0.1"
      || host === "::1"
      || host === "[::1]"
  } catch {
    return false
  }
}

/**
 * Picks env, canonical production, or local origin for client bundles.
 *
 * Dynamic `process.env[key]` lookups must not be used — Next will not inline them.
 * Loopback env values are ignored outside development so static/prod builds cannot
 * bake `http://localhost:…` from a local `.env` into the client bundle.
 *
 * @param envValue - Static `process.env.NEXT_PUBLIC_*` value.
 * @param canonical - Production canonical origin.
 * @returns Absolute origin without trailing slash.
 */
function clientSafeOrigin(envValue: string | undefined, canonical: string): string {
  if (envValue && envValue.trim().length > 0) {
    const trimmed = trimTrailingSlash(trimOrigin(envValue))
    if (process.env.NODE_ENV !== "development" && isLoopbackOrigin(trimmed)) {
      return trimTrailingSlash(canonical)
    }
    return trimmed
  }
  return trimTrailingSlash(canonical)
}

/**
 * Client-inlined public URLs for limetry.org.
 */
export const siteUrls = {
  web: clientSafeOrigin(
    process.env.NEXT_PUBLIC_WEB_URL,
    CANONICAL_ORIGINS.web,
  ),
  app: clientSafeOrigin(
    process.env.NEXT_PUBLIC_APP_URL,
    CANONICAL_ORIGINS.app,
  ),
  api: clientSafeOrigin(
    process.env.NEXT_PUBLIC_API_URL,
    CANONICAL_ORIGINS.ossApi,
  ),
  cloudWeb: clientSafeOrigin(
    process.env.NEXT_PUBLIC_CLOUD_WEB_URL
      ?? (process.env.NODE_ENV === "development" ? "http://localhost:3812" : undefined),
    LIMETRY_CLOUD_ORIGINS.web,
  ),
  github: trimTrailingSlash(process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/limetry/limetry"),
  discord: trimTrailingSlash(process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.gg/VxUWz7cZP"),
  contactUrl: clientSafeOrigin(
    process.env.NEXT_PUBLIC_CONTACT_FORM_URL,
    "https://app.limetry.com/contact",
  ),
} as const

/**
 * Returns whether an absolute HTTP link leaves Limetry's web surfaces.
 *
 * Limetry uses separate origins for the OSS site, Cloud, API, and local
 * development. They should all navigate in the current window.
 *
 * @param href - Link destination.
 * @returns True when the destination is an external HTTP origin.
 */
export function isExternalHref(href: string): boolean {
  if (!/^https?:\/\//i.test(href)) {
    return false
  }

  let hostname: string
  try {
    hostname = new URL(href).hostname.toLowerCase()
  } catch {
    return true
  }
  const isLocalhost =
    hostname === "localhost"
    || hostname === "127.0.0.1"
    || hostname === "::1"
    || hostname === "[::1]"
  const isLimetryHost =
    hostname === "limetry.org"
    || hostname.endsWith(".limetry.org")
    || hostname === "limetry.com"
    || hostname.endsWith(".limetry.com")

  return !isLocalhost && !isLimetryHost
}

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

