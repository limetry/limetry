/**
 * Shared CLI authentication lifecycle and recoverable bearer requests.
 */

import {
  clearAuthSession,
  type CliConfig,
  getAuthToken,
  getConfig,
  logError,
  saveConfig,
} from "./config.js"
import { describeHttpFailure } from "./errors.js"

type RefreshResponse = {
  accessToken: string
  refreshToken: string
  expiresIn: number
  baseUrl: string
}

/**
 * Refreshes a Cloud CLI session and persists the rotated credentials.
 *
 * @param config - Current CLI configuration.
 * @returns Updated configuration, or `null` when refresh is unavailable.
 */
export async function refreshCloudSession(config: CliConfig): Promise<CliConfig | null> {
  if (!config.refreshToken || config.authProvider !== "cloud") {
    return null
  }
  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/v1/auth/cli/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: "limetry-cli",
      refreshToken: config.refreshToken,
    }),
  })
  if (!response.ok) {
    return null
  }
  const session = (await response.json()) as RefreshResponse
  const nextConfig: CliConfig = {
    ...config,
    baseUrl: session.baseUrl || config.baseUrl,
    apiKey: session.accessToken,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    accessTokenExpiresAt: Date.now() + session.expiresIn * 1000,
  }
  saveConfig(nextConfig)
  return nextConfig
}

/**
 * Ensures an authenticated configuration, starting Cloud browser login when
 * no usable credentials exist.
 *
 * @returns Authenticated configuration.
 */
export async function ensureAuthenticatedConfig(): Promise<CliConfig> {
  const config = getConfig()
  if (config?.baseUrl && getAuthToken(config)) {
    return config
  }
  if (config?.authProvider === "oss") {
    logError("No OSS bearer token configured. Run `limetry setup` first.")
    process.exit(1)
  }

  const { clerkAuthProvider } = await import("../commands/auth/browser.js")
  await clerkAuthProvider.login(config?.baseUrl)
  const authenticated = getConfig()
  if (!authenticated?.baseUrl || !getAuthToken(authenticated)) {
    logError("Cloud authentication did not produce a usable session.")
    process.exit(1)
  }
  return authenticated
}

/**
 * Sends an authenticated request and recovers once from an expired Cloud token.
 *
 * @param config - Current CLI configuration.
 * @param path - API path beginning with `/`.
 * @param init - Fetch request options.
 * @returns Response after at most one refresh/re-authentication retry.
 */
export async function authenticatedFetch(
  config: CliConfig,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = `${config.baseUrl.replace(/\/$/, "")}${path}`
  const send = (current: CliConfig): Promise<Response> => {
    const headers = new Headers(init.headers)
    headers.set("Authorization", `Bearer ${getAuthToken(current)}`)
    return fetch(url, { ...init, headers })
  }

  let response = await send(config)
  if (response.status !== 401 || config.authProvider !== "cloud") {
    return response
  }

  let recovered = await refreshCloudSession(config)
  if (!recovered) {
    const { clerkAuthProvider } = await import("../commands/auth/browser.js")
    recovered = await clerkAuthProvider.login(config.baseUrl)
  }
  response = await send(recovered)
  return response
}

/**
 * Converts an unsuccessful response into the standard CLI error text.
 *
 * @param response - Failed HTTP response.
 * @returns Error with structured API detail.
 */
export async function responseError(response: Response): Promise<Error> {
  return new Error(describeHttpFailure(response.status, await response.text()))
}

/**
 * Clears persisted credentials after explicit logout or unrecoverable auth.
 *
 * @returns Nothing.
 */
export function clearPersistedSession(): void {
  const config = getConfig()
  if (config) {
    saveConfig(clearAuthSession(config))
  }
}
