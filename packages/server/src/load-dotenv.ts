/**
 * Dotenv bootstrap for `\@limetry/server` process entrypoints.
 */

import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import dotenvx from "@dotenvx/dotenvx"

/**
 * Absolute path to the limetry monorepo root (three levels above this file).
 */
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..")

/**
 * Loads the monorepo root `.env` via `@dotenvx/dotenvx` without logging.
 *
 * @returns Nothing.
 */
export function loadDotenv(): void {
  dotenvx.config({ path: repoRoot, quiet: true })
}
