/**
 * `limetry token create` — creates an access token via the Limetry API.
 *
 * Options: `--name`, `--scopes`, `--expires`. Missing name/scopes are prompted interactively.
 *
 * Side effects: `POST {baseUrl}/v1/tokens` with Bearer `apiKey`; prints the one-time token
 * secret; may `process.exit(1)`. Requires prior `limetry login` / config via {@link requireAuth}.
 */

import inquirer from "inquirer"

import { authenticatedFetch, ensureAuthenticatedConfig, responseError } from "../../utils/auth.js"
import { logError, logInfo, logSuccess } from "../../utils/config.js"

/**
 * Commander options for `limetry token create`.
 */
interface CreateTokenOptions {
  /**
   * Token display name; prompted when omitted.
   */
  name?: string
  /**
   * Scope strings; checkbox-prompted when empty.
   */
  scopes?: string[]
  /**
   * Expiration date parseable by `Date`; stored as ISO `expiresAt` or null.
   */
  expires?: string
}

/**
 * Creates a new access token and prints the secret once.
 *
 * @param options - Name, scopes, and optional expiration from CLI flags.
 * @returns Resolves when the token is created and printed.
 */
export async function tokenCreateCommand(options: CreateTokenOptions): Promise<void> {
  const config = await ensureAuthenticatedConfig()

  let name = options.name
  let scopes = options.scopes || []

  if (!name) {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: "Token name:",
      },
    ])
    name = answers.name
  }

  if (scopes.length === 0) {
    const answers = await inquirer.prompt([
      {
        type: "checkbox",
        name: "scopes",
        message: "Select scopes:",
        choices: ["read:rules", "write:rules", "read:tokens", "write:tokens"],
      },
    ])
    scopes = answers.scopes
  }

  try {
    logInfo("Creating access token...")

    const response = await authenticatedFetch(config, "/v1/tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        scopes,
        expiresAt: options.expires ? new Date(options.expires).toISOString() : null,
      }),
    })

    if (!response.ok) {
      throw await responseError(response)
    }

    const data = (await response.json()) as { id: string; token: string }

    console.log("\n" + "=".repeat(60))
    logSuccess("Access token created")
    console.log(`ID:    ${data.id}`)
    console.log(`Token: ${data.token}`)
    console.log("=".repeat(60))
    logInfo("Save this token securely. You won't be able to see it again.")
  } catch (error) {
    logError(error instanceof Error ? error.message : "Failed to create token")
    process.exit(1)
  }
}
