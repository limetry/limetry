/**
 * Listen URL normalization for local and Vercel-hosted preflight banners.
 */

import type { NetworkInterfaceInfo } from "node:os"
import { networkInterfaces } from "node:os"

/**
 * True for loopback hostnames commonly used in local listen URLs.
 *
 * @param hostname - Hostname portion of a listen URL.
 * @returns Whether the host should be treated as loopback.
 */
export function isLoopbackHostname(hostname: string): boolean {
  return hostname === "localhost"
    || hostname === "127.0.0.1"
    || hostname === "0.0.0.0"
    || hostname === "::"
    || hostname === "::1"
    || hostname === "[::1]"
}

/**
 * Non-internal IPv4 addresses from the given (or OS) network interfaces.
 * Reserved for tooling; banner listen URLs no longer enumerate LAN.
 *
 * @param interfaces - Interface map; defaults to `os.networkInterfaces()`.
 * @returns List of non-internal IPv4 address strings.
 */
export function lanIPv4Addresses(
  interfaces: NodeJS.Dict<NetworkInterfaceInfo[]> = networkInterfaces(),
): string[] {
  const ips: string[] = []
  for (const addrs of Object.values(interfaces)) {
    for (const addr of addrs ?? []) {
      const family = String(addr.family)
      const isV4 = family === "IPv4" || family === "4"
      if (isV4 && !addr.internal) {
        ips.push(addr.address)
      }
    }
  }
  return ips
}

/**
 * Builds a URL string from protocol, host, optional port, and path.
 *
 * @param protocol - URL protocol including trailing colon slash form from `URL`.
 * @param host - Hostname to embed.
 * @param port - Port string; omitted from the host part when empty.
 * @param path - Path without a trailing slash (may be empty).
 * @returns Assembled absolute URL string.
 */
function withPort(protocol: string, host: string, port: string, path: string): string {
  const hostPart = port ? `${host}:${port}` : host
  return `${protocol}//${hostPart}${path}`
}

/**
 * Returns the single canonical listen URL.
 * Loopback hosts are normalized to `localhost` so 127.0.0.1 / ::1 / 0.0.0.0
 * do not print as separate synonyms, and LAN interfaces are not enumerated.
 *
 * @param url - Raw listen URL from the server or adapter.
 * @returns One-element array with the canonical URL, or `[url]` when unparsable.
 */
export function expandListenUrls(url: string): string[] {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "")
    if (isLoopbackHostname(parsed.hostname)) {
      return [withPort(parsed.protocol, "localhost", parsed.port, path)]
    }
    return [`${parsed.origin}${path}`]
  } catch {
    return [url]
  }
}

/**
 * Prefer Vercel production/preview host from `source`, else `fallback`.
 *
 * @param fallback - URL used when no Vercel host env vars are present.
 * @param source - Injected env bag; read `VERCEL_*` from it only (not ambient process.env).
 * @returns Absolute public HTTPS (or existing scheme) listen URL.
 */
export function resolvePublicListenUrl(
  fallback: string,
  source: NodeJS.ProcessEnv = process.env,
): string {
  if (source.VERCEL_ENV === "production" && source.VERCEL_PROJECT_PRODUCTION_URL) {
    const host = source.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, "")
    return host.startsWith("http") ? host : `https://${host}`
  }
  if (source.VERCEL_URL) {
    const host = source.VERCEL_URL.replace(/\/$/, "")
    return host.startsWith("http") ? host : `https://${host}`
  }
  return fallback
}
