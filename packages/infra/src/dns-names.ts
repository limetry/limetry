/**
 * DNS hostname helpers for Cloudflare record names and public product URLs.
 */

import { httpsOrigin } from "./artifacts.js"

/**
 * Strips a trailing DNS dot from ACM / Cloudflare values.
 *
 * @param value - Hostname that may end with `.`.
 * @returns Value without a trailing dot.
 */
export function stripTrailingDot(value: string): string {
  return value.replace(/\.$/, "")
}

/**
 * Infers the Cloudflare zone for a hostname (`dev.limetry.org` → `limetry.org`).
 *
 * @param hostname - FQDN or apex hostname.
 * @returns Last two labels for multi-label hosts, otherwise the host itself.
 */
export function inferCloudflareZoneName(hostname: string): string {
  const host = stripTrailingDot(hostname).toLowerCase()
  const parts = host.split(".")
  if (parts.length <= 2) {
    return host
  }
  return parts.slice(-2).join(".")
}

/**
 * Relative Cloudflare record name for a hostname in a zone (`dev` or `@`).
 *
 * @param hostname - Full hostname inside the zone.
 * @param zoneName - Cloudflare zone apex.
 * @returns Relative record name (`@` for the apex).
 * @throws When `hostname` is not under `zoneName`.
 */
export function relativeRecordName(hostname: string, zoneName: string): string {
  const host = stripTrailingDot(hostname).toLowerCase()
  const zone = stripTrailingDot(zoneName).toLowerCase()
  if (host === zone) {
    return "@"
  }
  const suffix = `.${zone}`
  if (!host.endsWith(suffix)) {
    throw new Error(`${hostname} is not in Cloudflare zone ${zoneName}`)
  }
  return host.slice(0, -suffix.length)
}

/**
 * Lowercased FQDN without a trailing dot, for Cloudflare v6 `DnsRecord.name`.
 *
 * @param hostname - Record name from ACM or config.
 * @returns Normalized FQDN.
 */
export function dnsRecordFqdn(hostname: string): string {
  return stripTrailingDot(hostname).toLowerCase()
}

/**
 * Apex stacks get a `www` record; preview hosts like `dev.limetry.org` do not.
 *
 * @param domain - Stack marketing domain.
 * @param zoneName - Cloudflare zone name.
 * @returns True when domain equals the zone apex.
 */
export function shouldManageWww(domain: string, zoneName: string): boolean {
  return dnsRecordFqdn(domain) === dnsRecordFqdn(zoneName)
}

/**
 * Hostname from an API Gateway invoke URL or raw host.
 *
 * @param hostOrUrl - Raw host or `https://` URL.
 * @returns Hostname without scheme, path, or trailing dot.
 */
export function hostnameFromTarget(hostOrUrl: string): string {
  return stripTrailingDot(hostOrUrl)
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
}

/**
 * Operator hint describing a DNS-only Cloudflare CNAME.
 */
export type CloudflareHint = {
  /**
   * Always `CNAME` for traffic records in this stack.
   */
  type: "CNAME"
  /**
   * Relative record name within the zone.
   */
  name: string
  /**
   * CNAME target (CloudFront or API Gateway hostname).
   */
  content: string
  /**
   * Proxy flag; stack usage always passes `false` (DNS-only).
   */
  proxied: boolean
}

/**
 * Builds operator-facing CNAME hints for apex, optional www, and API.
 *
 * Callers should pass `proxied: false` so hints match DNS-only Cloudflare
 * records created by {@link upsertDnsRecord}.
 *
 * @param options - Hostnames, targets, zone, and proxy flag.
 * @returns Ordered list of CNAME hints.
 */
export function cloudflareTrafficHints(options: {
  apiHostname: string
  apiTarget: string
  domain: string
  includeWww: boolean
  proxied: boolean
  webTarget: string
  zoneName: string
}): CloudflareHint[] {
  const webContent = hostnameFromTarget(options.webTarget)
  const hints: CloudflareHint[] = [
    {
      type: "CNAME",
      name: relativeRecordName(options.domain, options.zoneName),
      content: webContent,
      proxied: options.proxied,
    },
  ]
  if (options.includeWww) {
    hints.push({
      type: "CNAME",
      name: relativeRecordName(`www.${options.domain}`, options.zoneName),
      content: webContent,
      proxied: options.proxied,
    })
  }
  hints.push({
    type: "CNAME",
    name: relativeRecordName(options.apiHostname, options.zoneName),
    content: hostnameFromTarget(options.apiTarget),
    proxied: options.proxied,
  })
  return hints
}

/**
 * End-user HTTPS origins for marketing, portal, and API hosts.
 */
export type PublicProductUrls = {
  /**
   * API product origin (`https://${apiHostname}`).
   */
  api: string
  /**
   * Cloud portal origin (`https://${portalHostname}`).
   */
  app: string
  /**
   * Marketing apex origin.
   */
  web: string
  /**
   * Optional www marketing origin when managed.
   */
  webWww: string | undefined
}

/**
 * End-user HTTPS origins for this stack (not CloudFront / execute-api hostnames).
 *
 * @param options - API, portal, domain, and www inclusion.
 * @returns Product URLs for stack exports and web env baking.
 */
export function ossPublicUrls(options: {
  apiHostname: string
  portalHostname: string
  domain: string
  includeWww: boolean
}): PublicProductUrls {
  return {
    api: httpsOrigin(options.apiHostname),
    app: httpsOrigin(options.portalHostname),
    web: httpsOrigin(options.domain),
    webWww: options.includeWww ? httpsOrigin(`www.${options.domain}`) : undefined,
  }
}
