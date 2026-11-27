/**
 * Shared href classification for Limetry's four web surfaces.
 *
 * Cross-product hops (OSS ↔ Cloud ↔ hosted API ↔ local loopback) stay in the
 * current window. Only true third-party origins open in a new tab.
 */

/**
 * True when `href` is an absolute `http(s)` URL.
 *
 * @param href - Link destination.
 * @returns Whether the href includes an http(s) scheme.
 */
export function isAbsoluteHttpHref(href: string): boolean {
  return /^https?:\/\//i.test(href)
}

/**
 * True when a URL hostname is part of the Limetry product family.
 *
 * Includes `limetry.org` / `limetry.com` (and subdomains) plus local loopback
 * used by the OSS site, Cloud app, and hosted APIs in development.
 *
 * @param href - Absolute or relative href.
 * @returns Whether the link should stay in the current tab.
 */
export function isLimetryFamilyHref(href: string): boolean {
  if (!isAbsoluteHttpHref(href)) {
    return true
  }
  try {
    const hostname = new URL(href).hostname.toLowerCase()
    return (
      hostname === "limetry.org"
      || hostname.endsWith(".limetry.org")
      || hostname === "limetry.com"
      || hostname.endsWith(".limetry.com")
      || hostname === "localhost"
      || hostname === "127.0.0.1"
      || hostname === "::1"
      || hostname === "[::1]"
    )
  } catch {
    return false
  }
}

/**
 * True when an absolute HTTP(S) link leaves Limetry's web surfaces.
 *
 * Relative paths, hash links, and Limetry-family origins are not external.
 * `mailto:` / `tel:` are treated as external so callers can opt into `_blank`.
 *
 * @param href - Link destination.
 * @returns Whether the destination should open outside the current tab by default.
 */
export function isExternalHref(href: string): boolean {
  if (href.startsWith("mailto:") || href.startsWith("tel:")) {
    return true
  }
  if (!isAbsoluteHttpHref(href)) {
    return false
  }
  return !isLimetryFamilyHref(href)
}
