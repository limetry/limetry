/**
 * `limetry login` — email/password JWT authentication against the Limetry API.
 *
 * Env: `LIMETRY_BASE_URL` (fallback base URL), `LIMETRY_BEARER_TOKEN` (preserved as `apiKey`
 * when no prior config apiKey exists).
 *
 * Side effects: writes JWT and user fields to `~/.limetry/config.json`; may `process.exit(1)`.
 */

import { clerkAuthProvider } from "./browser.js"

/**
 * Authenticates with email/password and persists the JWT session.
 *
 * Reads existing config via {@link getConfig}. If `email` is already set, returns early.
 * Posts to `POST {baseUrl}/v1/auth/login`.
 *
 * Base URL resolution order: saved `config.baseUrl`, then `LIMETRY_BASE_URL`, then
 * `https://api.limetry.org`.
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
  await clerkAuthProvider.login()
}
