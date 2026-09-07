/**
 * Shared preflight check and probe contracts used by `runPreflight` and adapters.
 */

/**
 * Discriminator for banner rows: environment variable, secret, or live probe.
 */
export type PreflightCheckKind = "env" | "secret" | "connectivity"

/**
 * One row in the preflight banner (env, secret, or connectivity).
 *
 * Severity:
 * - optional (`required: false`): warn only
 * - required: must be healthy for full features; does not abort unless critical
 * - critical: abort startup when `failHard` (defaults to true when `required` is true)
 */
export type PreflightCheck = {
  /**
   * When `required` is true, defaults to `true` (hard-fail). Set `false` for
   * degraded-but-bootable dependencies (billing, secondary upstreams, etc.).
   */
  critical?: boolean
  /**
   * Human-readable status text shown after the check name in the banner.
   */
  detail: string
  /**
   * Row kind for formatting; connectivity probes set this to `"connectivity"`.
   */
  kind?: PreflightCheckKind
  /**
   * Stable identifier for logging and failure summaries.
   */
  name: string
  /**
   * Whether the check or probe succeeded.
   */
  ok: boolean
  /**
   * When false, failures are warnings only and never block startup.
   */
  required: boolean
}

/**
 * Async connectivity check invoked by {@link runPreflight} when probing is enabled.
 */
export type ConnectivityProbe = {
  /**
   * When `required` is true, defaults to hard-fail. Set `false` to allow boot
   * with a degraded dependency.
   */
  critical?: boolean
  /**
   * Stable probe name used in the resulting {@link PreflightCheck}.
   */
  name: string
  /**
   * Whether a failed probe can block startup under `failHard`.
   */
  required: boolean
  /**
   * Executes the probe and returns a pass/fail detail string.
   *
   * @returns Probe outcome used to build a connectivity {@link PreflightCheck}.
   */
  run: () => Promise<{ detail: string; ok: boolean }>
}

/**
 * Result of a single probe attempt.
 */
export type ProbeResult = {
  /**
   * Human-readable outcome including elapsed time and error context when failed.
   */
  detail: string
  /**
   * Whether the probe succeeded.
   */
  ok: boolean
}

/**
 * Whether a failed check should abort the process under `failHard`.
 *
 * @param check - Subset of a {@link PreflightCheck} used for severity decisions.
 * @returns `true` when the check is required, not ok, and not explicitly non-critical.
 */
export function checkBlocksStartup(check: Pick<PreflightCheck, "critical" | "ok" | "required">): boolean {
  if (check.ok || !check.required) {
    return false
  }
  return check.critical !== false
}
