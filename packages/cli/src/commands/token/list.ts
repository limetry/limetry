/**
 * `limetry token list` — lists access tokens for the authenticated API key.
 *
 * Side effects: `GET {baseUrl}/v1/tokens`; prints token metadata to stdout;
 * may `process.exit(1)`. Requires config via {@link requireAuth}.
 */

import chalk from "chalk"

import { authenticatedFetch, ensureAuthenticatedConfig, responseError } from "../../utils/auth.js"
import { logError, logInfo } from "../../utils/config.js"

/**
 * Fetches and prints all access tokens for the current API key.
 *
 * @returns Resolves when listing completes (including empty list).
 */
export async function tokenListCommand(): Promise<void> {
  const config = await ensureAuthenticatedConfig()

  try {
    logInfo("Fetching access tokens...")

    const response = await authenticatedFetch(config, "/v1/tokens", {
      method: "GET",
    })

    if (!response.ok) {
      throw await responseError(response)
    }

    const data = (await response.json()) as Array<{
      id: string
      name: string
      token: string
      scopes: string[]
      createdAt: string
      expiresAt: string | null
    }>

    if (data.length === 0) {
      logInfo("No access tokens found")
      return
    }

    console.log("\n" + chalk.bold("Access Tokens:"))
    console.log("=".repeat(80))

    data.forEach((token, idx) => {
      const expires = token.expiresAt
        ? new Date(token.expiresAt).toLocaleDateString()
        : "Never"

      console.log(`${idx + 1}. ${chalk.green("●")} ${token.name}`)
      console.log(`   ID: ${token.id}`)
      console.log(`   Token: ${token.token}`)
      console.log(`   Scopes: ${token.scopes.join(", ")}`)
      console.log(`   Created: ${new Date(token.createdAt).toLocaleDateString()}`)
      console.log(`   Expires: ${expires}`)
      console.log("")
    })
  } catch (error) {
    logError(error instanceof Error ? error.message : "Failed to fetch tokens")
    process.exit(1)
  }
}
