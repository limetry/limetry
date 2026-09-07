/**
 * Dotenv file discovery and default-value annotation for preflight context lines.
 */

import { existsSync } from "node:fs"
import { join, relative, resolve } from "node:path"

const DOTENV_NAMES = [
  ".env",
  ".env.local",
  ".env.development",
  ".env.development.local",
  ".env.production",
  ".env.production.local",
]

/**
 * Human-readable list of dotenv files that dotenvx would load from `cwd` upward,
 * or a Vercel note when `source.VERCEL` is set.
 *
 * @param source - Injected env bag (checks `VERCEL`); defaults to `process.env` at call site.
 * @param cwd - Starting directory for upward dotenv discovery; defaults to `process.cwd()`.
 * @returns Comma-separated relative paths, a Vercel note, or `"none (process.env only)"`.
 */
export function listEffectiveDotenvFiles(
  source: NodeJS.ProcessEnv = process.env,
  cwd = process.cwd(),
): string {
  if (source.VERCEL) {
    return "Vercel project environment (dotenvx skipped)"
  }
  const roots = [cwd, join(cwd, ".."), join(cwd, "../..")]
  const found: string[] = []
  const seen = new Set<string>()
  for (const root of roots) {
    for (const name of DOTENV_NAMES) {
      const absolute = resolve(root, name)
      if (!existsSync(absolute) || seen.has(absolute)) {
        continue
      }
      seen.add(absolute)
      found.push(relative(cwd, absolute) || name)
    }
  }
  return found.length > 0 ? found.join(", ") : "none (process.env only)"
}

/**
 * Appends ` (from default)` when `name` is unset/blank on `source`.
 * Use for context lines that show resolved values that may not come from env.
 *
 * @param name - Env key to inspect on `source`.
 * @param display - Display text for the resolved value.
 * @param source - Injected env bag; defaults to `process.env` at call site.
 * @returns `display`, optionally annotated when the key is unset.
 */
export function annotated(
  name: string,
  display: string,
  source: NodeJS.ProcessEnv = process.env,
): string {
  const raw = source[name]
  if (raw === undefined || raw.trim() === "") {
    return `${display}  (from default)`
  }
  return display
}
