/**
 * Product version from the Limetry package manifest.
 *
 * In the monorepo this matches the root `package.json` (releasekit stamps both).
 * On npm, this package's own `package.json` is the source of truth.
 */

import packageJson from "../package.json" with { type: "json" }

/**
 * Bare product semver from package.json (e.g. `1.2.92`).
 *
 * Kept for published `@limetry/cli` / `@limetry/mcp` builds that still import
 * `APP_VERSION`. Prefer {@link AppVersion} in new code.
 *
 * @deprecated Use {@link AppVersion} (`v`-prefixed) instead.
 */
export const APP_VERSION: string = packageJson.version

/**
 * Returns the product version with a leading `v` (e.g. `v1.2.92`).
 */
export function AppVersion(): string {
  return `v${packageJson.version}`
}
