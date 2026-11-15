/**
 * Product version from the Limetry package manifest.
 *
 * In the monorepo this matches the root `package.json` (releasekit stamps both).
 * On npm, this package's own `package.json` is the source of truth.
 */

import packageJson from "../package.json" with { type: "json" }

/**
 * Returns the product version with a leading `v` (e.g. `v1.2.87`).
 */
export function AppVersion(): string {
  return `v${packageJson.version}`
}
