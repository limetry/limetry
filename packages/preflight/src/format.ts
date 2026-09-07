/**
 * Human-readable preflight banner rendering for stdout via the preflight logger.
 */

import { formatCheckLine, formatConnectivityLine } from "./checks.js"
import type { PreflightCheck } from "./types.js"

/**
 * Horizontal rule used between banner sections.
 */
export const PREFLIGHT_SEPARATOR = "-----------------------------------------"

/**
 * Builds a titled subsection when `lines` is non-empty.
 *
 * @param title - Subsection label (e.g. `"Required:"`).
 * @param lines - Already-formatted body lines.
 * @returns Title plus indented body lines, or an empty array.
 */
function sectionLines(title: string, lines: string[]): string[] {
  if (lines.length === 0) {
    return []
  }
  return [`  ${title}`, ...lines.map((line) => `    ${line}`)]
}

/**
 * Partitions checks into required vs optional for banner grouping.
 *
 * @param checks - Checks to split.
 * @returns Two arrays keyed by `required`.
 */
function splitRequiredOptional(checks: PreflightCheck[]): {
  optional: PreflightCheck[]
  required: PreflightCheck[]
} {
  return {
    required: checks.filter((check) => check.required),
    optional: checks.filter((check) => !check.required),
  }
}

/**
 * Renders the human-readable preflight banner (stdout via the preflight logger).
 *
 * Prefer `envChecks` + `connectivityChecks` + `contextLines` over deprecated
 * `configuration` / `connectivity` string lists so Required/Optional grouping works.
 *
 * @param input - Banner sections and overall pass/warn outcome.
 * @returns Multi-line banner string ready to log.
 */
export function formatPreflightReport(input: {
  appVersion?: string
  /**
   * @deprecated Prefer `envChecks` so Required/Optional grouping is automatic.
   * When `envChecks` is set, these lines render under Context.
   */
  configuration?: string[]
  /**
   * @deprecated Prefer `connectivityChecks`. Kept for older call sites.
   */
  connectivity?: string[]
  connectivityChecks?: PreflightCheck[]
  contextLines?: string[]
  envChecks?: PreflightCheck[]
  envFiles: string
  listenUrls?: string[]
  passed: boolean
  product: string
  warnings: boolean
}): string {
  const envChecks = input.envChecks ?? []
  const connectivityChecks = input.connectivityChecks ?? []
  const envSplit = splitRequiredOptional(envChecks)
  const connSplit = splitRequiredOptional(connectivityChecks)

  const configurationBlock = envChecks.length > 0
    ? [
      "🔍 Environment Configuration:",
      ...sectionLines("Required:", envSplit.required.map(formatCheckLine)),
      ...sectionLines("Optional:", envSplit.optional.map(formatCheckLine)),
      ...sectionLines(
        "Context:",
        input.contextLines ?? input.configuration ?? [],
      ),
    ]
    : [
      "🔍 Environment Configuration:",
      ...(input.configuration ?? []).map((line) => `  • ${line}`),
    ]

  const connectivityBlock = connectivityChecks.length > 0
    ? [
      "🔌 Connectivity:",
      ...sectionLines("Required:", connSplit.required.map(formatConnectivityLine)),
      ...sectionLines("Optional:", connSplit.optional.map(formatConnectivityLine)),
    ]
    : (input.connectivity ?? [])

  const outcome = input.passed
    ? input.warnings
      ? "⚠️ Preflight Check Passed with warnings."
      : "✨ Preflight Check Passed!"
    : "❌ Preflight Check Failed!"
  const listenLines = (input.listenUrls ?? []).map((url) => `🚀 ${url}`)
  const appVersionLine = input.appVersion
    ? [`✅ App Version: ${input.appVersion}`]
    : []

  return [
    PREFLIGHT_SEPARATOR,
    `🚀 ${input.product}: Starting Preflight Check`,
    PREFLIGHT_SEPARATOR,
    `✅ Env files (effective for dotenvx): ${input.envFiles}`,
    PREFLIGHT_SEPARATOR,
    ...configurationBlock,
    PREFLIGHT_SEPARATOR,
    ...connectivityBlock,
    ...(connectivityBlock.length > 0 ? [PREFLIGHT_SEPARATOR] : []),
    ...appVersionLine,
    `✅ Node Version: ${process.version}`,
    PREFLIGHT_SEPARATOR,
    outcome,
    ...listenLines,
    PREFLIGHT_SEPARATOR,
  ].join("\n")
}

export { formatCheckLine, formatConnectivityLine }
