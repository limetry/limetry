/**
 * `limetry token scope` — placeholder for scope add/remove/view actions.
 *
 * Accepted actions: `add`, `remove`, `view`. Scope mutation is not implemented in-CLI;
 * users are directed to `limetry token list` or the web portal.
 *
 * Side effects: may `process.exit(1)` for unknown actions; no API writes.
 */

import { logError, logInfo } from "../../utils/config.js"

/**
 * Handles `limetry token scope <action>` for add/remove/view.
 *
 * @param action - One of `add`, `remove`, or `view`.
 * @returns Resolves after printing guidance (or exits on unknown action).
 */
export async function tokenScopeCommand(action: string): Promise<void> {
  const actions = ["add", "remove", "view"]

  if (!actions.includes(action)) {
    logError(`Unknown action: ${action}. Use add, remove, or view.`)
    process.exit(1)
  }

  try {
    if (action === "view") {
      logInfo("List tokens first: limetry token list")
      return
    }

    logInfo(`Scope action: ${action}`)
    logInfo("Scope management available via the web portal")
  } catch (error) {
    logError(error instanceof Error ? error.message : "Failed to manage scopes")
    process.exit(1)
  }
}
