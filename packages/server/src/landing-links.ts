/**
 * Resolves marketing-site links injected into the API landing HTML.
 *
 * Docs live on the OSS marketing origin (`limetry.org`), not the Cloud portal
 * (`limetry.com`). Prefer explicit env so Vercel and AWS can diverge by stack.
 */

/**
 * Canonical production marketing origin for Limetry OSS docs.
 */
export const CANONICAL_WEB_ORIGIN = "https://limetry.org"

/**
 * Local marketing site origin used when not in a deployed runtime.
 */
export const LOCAL_WEB_ORIGIN = "http://localhost:3800"

/**
 * Strips a trailing slash from an origin URL.
 *
 * @param value - Origin or URL string.
 * @returns Value without a trailing `/`.
 */
function trimOrigin(value: string): string {
  return value.replace(/\/$/, "")
}

/**
 * True when the process is a deployed Vercel / Lambda / production runtime.
 *
 * @param source - Process env bag.
 * @returns Whether canonical production origins should be preferred.
 */
function isDeployedRuntime(source: NodeJS.ProcessEnv): boolean {
  return Boolean(
    source.VERCEL
    || source.VERCEL_ENV
    || source.AWS_LAMBDA_FUNCTION_NAME
    || source.NODE_ENV === "production",
  )
}

/**
 * Resolves the absolute marketing origin used for Docs / site footer links.
 *
 * Priority: `NEXT_PUBLIC_WEB_URL` → `LIMETRY_WEB_URL` → canonical / local.
 *
 * @param source - Process env bag; defaults to `process.env`.
 * @returns Absolute origin without a trailing slash.
 */
export function resolveLandingWebOrigin(
  source: NodeJS.ProcessEnv = process.env,
): string {
  const explicit = source.NEXT_PUBLIC_WEB_URL ?? source.LIMETRY_WEB_URL
  if (explicit && explicit.trim().length > 0) {
    return trimOrigin(explicit.trim())
  }
  return isDeployedRuntime(source) ? CANONICAL_WEB_ORIGIN : LOCAL_WEB_ORIGIN
}

/**
 * Builds the quick-start docs URL for the API landing page.
 *
 * @param webOrigin - Absolute marketing origin from {@link resolveLandingWebOrigin}.
 * @returns Absolute docs quick-start URL.
 */
export function docsQuickStartUrl(webOrigin: string): string {
  return `${trimOrigin(webOrigin)}/docs/quick-start`
}

/**
 * Substitutes landing-page placeholders (`__APP_VERSION__`, `__WEB_ORIGIN__`).
 *
 * @param html - Raw `public/index.html` contents.
 * @param input - Version and marketing origin for substitution.
 * @returns HTML ready to send to the client.
 */
export function renderLandingHtml(
  html: string,
  input: { appVersion: string, webOrigin: string },
): string {
  const origin = trimOrigin(input.webOrigin)
  return html
    .replaceAll("__APP_VERSION__", input.appVersion)
    .replaceAll("__WEB_ORIGIN__", origin)
}
