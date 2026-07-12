/**
 * Resolve public web, app, and API origins from env, Vercel, or canonical defaults.
 */

/**
 * Where a resolved origin URL came from.
 */
export type OriginSource = "env" | "vercel" | "canonical" | "default"

/**
 * Absolute origin URL plus its resolution source.
 */
export type ResolvedOrigin = {
  source: OriginSource
  url: string
}

/**
 * Stable product origins. Keep aligned with `packages/infra` Pulumi defaults
 * (`domain`, `apiHostname`) and sibling portal/API hostnames when configured.
 */
export const CANONICAL_ORIGINS = {
  web: "https://limetry.org",
  app: "https://app.limetry.com",
  ossApi: "https://api.limetry.org",
} as const

const LOCAL_ORIGINS = {
  web: "http://localhost:3800",
  app: "http://localhost:3830",
  ossApi: "http://localhost:3810",
} as const

/**
 * Strips a trailing slash from an origin URL.
 *
 * @param value - Origin or URL string.
 * @returns Value without a trailing `/`.
 */
export function trimOrigin(value: string): string {
  return value.replace(/\/$/, "")
}

/**
 * Ensures an absolute `https://` origin when given a bare host.
 *
 * @param hostOrUrl - Hostname or full URL.
 * @returns Absolute origin with scheme.
 */
export function withHttpsOrigin(hostOrUrl: string): string {
  const trimmed = trimOrigin(hostOrUrl.trim())
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed
  }
  return `https://${trimmed}`
}

/**
 * Returns the first non-empty env URL among `keys`.
 *
 * @param source - Process env object.
 * @param keys - Candidate env var names in priority order.
 * @returns Trimmed origin or `undefined`.
 */
export function firstEnvUrl(source: NodeJS.ProcessEnv, keys: string[]): string | undefined {
  for (const key of keys) {
    const raw = source[key]
    if (raw && raw.trim().length > 0) {
      return trimOrigin(raw.trim())
    }
  }
  return undefined
}

/**
 * Detects Vercel, Lambda, or production Node runtimes.
 *
 * @param source - Process env; defaults to `process.env`.
 * @returns `true` when running in a deployed environment.
 */
export function isDeployedEnv(source: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(
    source.VERCEL
    || source.VERCEL_ENV
    || source.AWS_LAMBDA_FUNCTION_NAME
    || source.NODE_ENV === "production",
  )
}

/**
 * Derives this deployment's public origin from Vercel env when present.
 *
 * @param source - Process env; defaults to `process.env`.
 * @returns HTTPS origin or `undefined`.
 */
export function vercelSelfOrigin(source: NodeJS.ProcessEnv = process.env): string | undefined {
  if (source.VERCEL_ENV === "production" && source.VERCEL_PROJECT_PRODUCTION_URL) {
    return withHttpsOrigin(source.VERCEL_PROJECT_PRODUCTION_URL)
  }
  if (source.VERCEL_URL) {
    return withHttpsOrigin(source.VERCEL_URL)
  }
  return undefined
}

/**
 * Resolves one product origin with env → Vercel self → canonical → local priority.
 *
 * @param explicit - Explicit env URL when set.
 * @param deployedFallback - Canonical production URL.
 * @param localFallback - Local development URL.
 * @param source - Process env for deploy detection.
 * @param selfOrigin - Optional Vercel self origin.
 * @returns Resolved origin and source tag.
 */
function resolveOrigin(
  explicit: string | undefined,
  deployedFallback: string,
  localFallback: string,
  source: NodeJS.ProcessEnv,
  selfOrigin?: string,
): ResolvedOrigin {
  if (explicit) {
    return { url: explicit, source: "env" }
  }
  if (selfOrigin) {
    return { url: selfOrigin, source: "vercel" }
  }
  if (isDeployedEnv(source)) {
    return { url: deployedFallback, source: "canonical" }
  }
  return { url: localFallback, source: "default" }
}

/**
 * Resolves marketing site, Cloud app, and OSS API origins.
 *
 * @param source - Process env; defaults to `process.env`.
 * @returns Named {@link ResolvedOrigin} map.
 */
export function resolveWebOrigins(source: NodeJS.ProcessEnv = process.env): {
  api: ResolvedOrigin
  app: ResolvedOrigin
  web: ResolvedOrigin
} {
  return {
    web: resolveOrigin(
      firstEnvUrl(source, ["NEXT_PUBLIC_WEB_URL"]),
      CANONICAL_ORIGINS.web,
      LOCAL_ORIGINS.web,
      source,
      vercelSelfOrigin(source),
    ),
    app: resolveOrigin(
      firstEnvUrl(source, ["NEXT_PUBLIC_APP_URL"]),
      CANONICAL_ORIGINS.app,
      LOCAL_ORIGINS.app,
      source,
    ),
    api: resolveOrigin(
      firstEnvUrl(source, ["NEXT_PUBLIC_API_URL"]),
      CANONICAL_ORIGINS.ossApi,
      LOCAL_ORIGINS.ossApi,
      source,
    ),
  }
}

/**
 * Formats a preflight configuration line for a resolved origin.
 *
 * @param name - Env var or label (for example `NEXT_PUBLIC_WEB_URL`).
 * @param resolved - Resolved origin.
 * @returns Single report line.
 */
export function describeResolvedOrigin(name: string, resolved: ResolvedOrigin): string {
  const display = resolved.url.length > 0 ? resolved.url : "(same-origin proxy)"
  if (resolved.source === "env") {
    return `${name}: ${display}`
  }
  const label = resolved.source === "default" ? "from default" : `from ${resolved.source}`
  return `${name}: ${display}  (${label})`
}
