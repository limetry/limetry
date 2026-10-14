/**
 * Classifies a Limetry API and decides whether a pasted bearer token is usable.
 */

import { LIMETRY_CLOUD_APP_ORIGIN } from "@limetry/sdk"

/**
 * Which product the `/health` payload describes.
 */
export type ApiKind = "oss" | "cloud" | "unknown"

/**
 * Outcome of an authenticated probe.
 */
export type BearerProbe = "valid" | "invalid" | "unreachable"

/**
 * Reads the product from a `/health` JSON body.
 *
 * @param body - Parsed health payload.
 * @returns Cloud, OSS, or unknown.
 */
export function classifyHealthBody(body: unknown): ApiKind {
  if (!body || typeof body !== "object" || !("service" in body)) {
    return "unknown"
  }
  const service = String((body as { service?: unknown }).service ?? "")
  if (service.includes("enterprise")) {
    return "cloud"
  }
  if (service === "limetry-server") {
    return "oss"
  }
  return "unknown"
}

/**
 * Maps an authenticated probe status to a setup result.
 *
 * @param status - HTTP status from `GET /v1/rules`.
 * @returns Whether the bearer token is usable.
 */
export function bearerProbeResult(status: number): BearerProbe {
  if (status === 401 || status === 403) {
    return "invalid"
  }
  if (status >= 200 && status < 300) {
    return "valid"
  }
  return "unreachable"
}

/**
 * Returns whether an API base URL is on this machine.
 *
 * @param value - API base URL.
 * @returns `true` for localhost and loopback hosts.
 */
export function isLoopbackBaseUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname
    return host === "localhost" || host === "127.0.0.1" || host === "::1"
  } catch {
    return false
  }
}

/**
 * Picks the portal origin that matches an API deployment.
 *
 * @param apiUrl - API base URL.
 * @returns Portal origin used for browser sign-in.
 */
export function defaultCloudPortalUrl(apiUrl: string): string {
  if (isLoopbackBaseUrl(apiUrl)) {
    return "http://localhost:3830"
  }
  return LIMETRY_CLOUD_APP_ORIGIN
}
