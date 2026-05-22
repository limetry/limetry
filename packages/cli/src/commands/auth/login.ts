/**
 * `limetry login` — email/password JWT authentication against the Limetry API.
 *
 * Env: `LIMETRY_BASE_URL` (fallback base URL), `LIMETRY_BEARER_TOKEN` (preserved as `apiKey`
 * when no prior config apiKey exists).
 *
 * Side effects: writes JWT and user fields to `~/.limetry/config.json`; may `process.exit(1)`.
 */

import fetch from "node-fetch"

import {
  getConfig,
  logError,
  logInfo,
  logSuccess,
  promptForEmail,
  promptForPassword,
  saveConfig,
} from "../../utils/config.js"

/**
 * Authenticates with email/password and persists the JWT session.
 *
 * Reads existing config via {@link getConfig}. If `email` is already set, returns early.
 * Posts to `POST {baseUrl}/v1/auth/login`.
 *
 * Base URL resolution order: saved `config.baseUrl`, then `LIMETRY_BASE_URL`, then
 * `http://localhost:3810`.
 *
 * Side effects:
 * - Prompts for email and password on stdin.
 * - Calls the auth API.
 * - Writes updated {@link CliConfig} including `jwtToken`, `tenantId`, `userId`, `email`.
 * - Exits with code 1 on authentication failure.
 *
 * @returns Resolves when already logged in or login succeeds.
 */
export async function loginCommand(): Promise<void> {
  const config = getConfig()

  if (config?.email) {
    logInfo("Already authenticated as " + config.email)
    return
  }

  const email = await promptForEmail()
  const password = await promptForPassword()

  const baseUrl =
    config?.baseUrl || process.env.LIMETRY_BASE_URL || "http://localhost:3810"

  try {
    logInfo("Authenticating...")

    const response = await fetch(`${baseUrl}/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = (await response.json()) as Record<string, unknown>
      throw new Error(String(error.message || "Authentication failed"))
    }

    const data = (await response.json()) as {
      token: string
      user: {
        id: string
        email: string
        tenantId: string
      }
    }

    saveConfig({
      baseUrl,
      apiKey: config?.apiKey ?? process.env.LIMETRY_BEARER_TOKEN ?? "",
      jwtToken: data.token,
      tenantId: data.user.tenantId,
      userId: data.user.id,
      email: data.user.email,
    })

    logSuccess(`Authenticated as ${email}`)
  } catch (error) {
    logError(
      error instanceof Error ? error.message : "Authentication failed",
    )
    process.exit(1)
  }
}
