/**
 * CLI session commands for Cloud browser authentication.
 */

import {
  clearPersistedSession,
  ensureAuthenticatedConfig,
  refreshCloudSession,
} from "../../utils/auth.js"
import { getAuthToken, getConfig, logError, logInfo, logSuccess } from "../../utils/config.js"

/**
 * Shows the current CLI authentication status.
 *
 * @returns Resolves after status output.
 */
export async function authStatusCommand(): Promise<void> {
  const config = getConfig()
  if (!config?.baseUrl || !getAuthToken(config)) {
    logInfo("Not authenticated. Run `limetry auth login`.")
    return
  }
  if (config.authProvider === "cloud" && config.accessTokenExpiresAt && config.accessTokenExpiresAt <= Date.now()) {
    const refreshed = await refreshCloudSession(config)
    if (!refreshed) {
      logError("Cloud session expired. Run `limetry auth login`.")
      process.exit(1)
    }
  }
  const current = getConfig()
  logSuccess(`Authenticated${current?.email ? ` as ${current.email}` : ""}`)
  logInfo(`API: ${current?.baseUrl ?? config.baseUrl}`)
}

/**
 * Ensures a current session and emits shell exports without logging secrets.
 *
 * @returns Resolves after printing shell commands.
 */
export async function authEnvCommand(): Promise<void> {
  const config = await ensureAuthenticatedConfig()
  const token = getAuthToken(config)
  const quote = (value: string): string => `'${value.replace(/'/g, "'\\''")}'`
  console.log(`export LIMETRY_BASE_URL=${quote(config.baseUrl)}`)
  console.log(`export LIMETRY_API_KEY=${quote(token)}`)
}

/**
 * Revokes the Cloud refresh session and clears local credentials.
 *
 * @returns Resolves after logout.
 */
export async function authLogoutCommand(): Promise<void> {
  const config = getConfig()
  if (config?.refreshToken && config.authProvider === "cloud") {
    await fetch(`${config.baseUrl.replace(/\/$/, "")}/v1/auth/cli/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: "limetry-cli",
        refreshToken: config.refreshToken,
      }),
    }).catch(() => undefined)
  }
  clearPersistedSession()
  logSuccess("Logged out")
}
