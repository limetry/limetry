/**
 * Orchestrates env checks, connectivity probes, banner logging, and fail-hard policy.
 */

import type { Logger } from "pino"

import { connectivityIcon } from "./checks.js"
import { listEffectiveDotenvFiles } from "./dotenv-files.js"
import { shouldFailHard, shouldProbeConnectivity } from "./env-runtime.js"
import { formatPreflightReport } from "./format.js"
import { expandListenUrls } from "./listen-urls.js"
import { createPreflightLogger } from "./logger.js"
import { checkBlocksStartup, type ConnectivityProbe, type PreflightCheck } from "./types.js"

/**
 * Options for {@link runPreflight}.
 *
 * Pass product-validated checks via `envChecks` (built from a typed env object
 * at the adapter). Use `env` / `source` only as the injected ProcessEnv bag for
 * dotenv listing, fail-hard policy, and logger — not as a substitute for Zod.
 */
export type RunPreflightOptions = {
  /**
   * Optional app version string rendered in the banner when provided.
   */
  appVersion?: string
  /**
   * Extra context lines (NODE_ENV, ports, derived DB host) shown under Context.
   * Prefer putting pass/fail settings in `envChecks`.
   */
  configuration?: string[]
  /**
   * Injected env bag merged over `process.env` for runtime flags and dotenv listing.
   * Prefer passing the same bag your adapter already used for Zod parse.
   */
  env?: NodeJS.ProcessEnv
  /**
   * Product-built env/secret checks included in the banner and fail-hard evaluation.
   */
  envChecks?: PreflightCheck[]
  /**
   * Override fail-hard policy. Defaults to {@link shouldFailHard} for the env bag.
   */
  failHard?: boolean
  /**
   * Listen URL expanded into banner “ready” lines via {@link expandListenUrls}.
   */
  listenUrl?: string
  /**
   * Optional Pino logger; defaults to {@link createPreflightLogger} for `product`.
   */
  logger?: Logger
  /**
   * Connectivity probes run when probing is enabled for the env bag.
   */
  probes?: ConnectivityProbe[]
  /**
   * Product display name used in the banner title and logger name.
   */
  product: string
  /**
   * When true, skips all probes. Defaults to the inverse of {@link shouldProbeConnectivity}.
   */
  skipConnectivity?: boolean
}

/**
 * Runs env checks + optional connectivity probes, prints the banner, and throws
 * when blocking required checks fail under `failHard`.
 *
 * Side effects: writes structured preflight logs (banner + `preflight.complete`).
 *
 * @param options - Product name, checks, probes, and runtime policy overrides.
 * @returns All env and connectivity {@link PreflightCheck} rows evaluated.
 * @throws Error When one or more blocking required checks fail and `failHard` is true.
 */
export async function runPreflight(options: RunPreflightOptions): Promise<PreflightCheck[]> {
  const source = { ...process.env, ...(options.env ?? {}) }
  const logger = options.logger ?? createPreflightLogger(options.product, source)
  const envChecks: PreflightCheck[] = [...(options.envChecks ?? [])]
  const skipConnectivity = options.skipConnectivity ?? !shouldProbeConnectivity(source)
  const connectivity: PreflightCheck[] = []

  if (!skipConnectivity) {
    for (const probe of options.probes ?? []) {
      const result = await probe.run()
      connectivity.push({
        name: probe.name,
        ok: result.ok,
        required: probe.required,
        critical: probe.critical,
        detail: result.detail,
        kind: "connectivity",
      })
    }
  }

  const checks = [...envChecks, ...connectivity]
  const failedBlocking = checks.filter((check) => checkBlocksStartup(check))
  const failedRequired = checks.filter((check) => check.required && !check.ok)
  const failedOptional = checks.filter((check) => !check.required && !check.ok)
  const passed = failedBlocking.length === 0
  const warnings = failedOptional.length > 0 || failedRequired.some((check) => check.critical === false)
  const listenUrls = options.listenUrl ? expandListenUrls(options.listenUrl) : []

  const report = formatPreflightReport({
    product: options.product,
    appVersion: options.appVersion,
    envFiles: listEffectiveDotenvFiles(source),
    envChecks,
    contextLines: options.configuration,
    connectivityChecks: connectivity,
    passed,
    warnings,
    listenUrls,
  })

  logger.info({
    preflightBanner: true,
    passed,
    warnings,
    listenUrls,
    appVersion: options.appVersion,
  }, report)
  logger.info({
    event: "preflight.complete",
    passed,
    warnings,
    listenUrls,
    appVersion: options.appVersion,
    failedBlocking: failedBlocking.map((check) => check.name),
    failedRequired: failedRequired.map((check) => check.name),
    failedOptional: failedOptional.map((check) => check.name),
  }, "preflight.complete")

  const failHard = options.failHard ?? shouldFailHard(source)
  if (!passed && failHard) {
    throw new Error(
      `Preflight failed: ${failedBlocking.map((check) => `${check.name} (${check.detail})`).join("; ")}`,
    )
  }

  return checks
}

export { connectivityIcon }
