/**
 * `limetry token revoke` — deletes an access token after interactive confirmation.
 *
 * Side effects: prompts for confirmation; `DELETE {baseUrl}/v1/tokens/{tokenId}`;
 * may `process.exit(1)`. Requires config via {@link requireAuth}.
 */

import inquirer from "inquirer"

import { authenticatedFetch, ensureAuthenticatedConfig, responseError } from "../../utils/auth.js"
import { logError, logInfo, logSuccess } from "../../utils/config.js"

/**
 * Revokes the given access token after the user confirms.
 *
 * @param tokenId - Token id argument from `limetry token revoke <tokenId>`.
 * @returns Resolves when revoked or the user cancels.
 */
export async function tokenRevokeCommand(tokenId: string): Promise<void> {
  const config = await ensureAuthenticatedConfig()

  const answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: `Are you sure you want to revoke token ${tokenId}?`,
      default: false,
    },
  ])

  if (!answers.confirm) {
    logInfo("Cancelled")
    return
  }

  try {
    logInfo("Revoking token...")

    const response = await authenticatedFetch(config, `/v1/tokens/${tokenId}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw await responseError(response)
    }

    logSuccess("Token revoked")
  } catch (error) {
    logError(error instanceof Error ? error.message : "Failed to revoke token")
    process.exit(1)
  }
}
