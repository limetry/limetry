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

const PUBLISH_DEPENDENCIES: Record<PublishablePackage, readonly PublishablePackage[]> = {
  ci: ["sdk"],
  cli: ["sdk"],
  mcp: ["sdk"],
  preflight: [],
  sdk: [],
  shopify: ["sdk"],
  sql: ["sdk"],
  ui: [],
}

/**
 * Includes npm workspaces required by the selected packages.
 *
 * @param packages - Explicit package selections.
 * @returns Selected packages and their transitive dependencies in canonical order.
 */
export function includePublishDependencies(
  packages: readonly PublishablePackage[],
): PublishablePackage[] {
  const selected = new Set(packages)
  const addDependencies = (packageName: PublishablePackage): void => {
    for (const dependency of PUBLISH_DEPENDENCIES[packageName]) {
      if (!selected.has(dependency)) {
        selected.add(dependency)
        addDependencies(dependency)
      }
    }
  }

  for (const packageName of packages) {
    addDependencies(packageName)
  }

  return PUBLISHABLE_PACKAGES.filter((packageName) => selected.has(packageName))
}

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

  return includePublishDependencies(requested.filter(isPublishablePackage))
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
