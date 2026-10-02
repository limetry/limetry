/**
 * npm-publishable workspace packages with tag-triggered GitHub Actions.
 */
export const PUBLISHABLE_PACKAGES = [
  "ci",
  "cli",
  "mcp",
  "preflight",
  "sdk",
  "shopify",
  "sql",
  "ui",
] as const

export type PublishablePackage = typeof PUBLISHABLE_PACKAGES[number]

/**
 * Checks whether a string is a known public workspace package key.
 *
 * @param value - Candidate package key.
 * @returns `true` when `value` can trigger an npm publish workflow.
 */
export function isPublishablePackage(value: string): value is PublishablePackage {
  return PUBLISHABLE_PACKAGES.some((packageName) => packageName === value)
}

/**
 * Parses the release prompt's comma-separated package selection.
 *
 * @param selection - Package keys, `all`, or an empty/`none` selection.
 * @returns Selected package keys in canonical order.
 * @throws If any package key is unknown.
 */
export function parsePublishSelection(selection: string): PublishablePackage[] {
  const normalized = selection.trim().toLowerCase()
  if (!normalized || normalized === "none") {
    return []
  }
  if (normalized === "all") {
    return [...PUBLISHABLE_PACKAGES]
  }

  const requested = normalized.split(",").map((name) => name.trim())
  const invalid = requested.filter((name) => !isPublishablePackage(name))
  if (invalid.length > 0) {
    throw new Error(`Unknown publish package(s): ${invalid.join(", ")}`)
  }

  const selected = new Set(requested)
  return PUBLISHABLE_PACKAGES.filter((name) => selected.has(name))
}

/**
 * Creates the Git tag consumed by a package's npm publish workflow.
 *
 * @param packageName - Publishable package key.
 * @param version - Root release version.
 * @returns Tag such as `sdk-v1.2.041`.
 */
export function packagePublishTag(packageName: PublishablePackage, version: string): string {
  return `${packageName}-v${version}`
}
