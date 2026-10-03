/**
 * Startup and build-time preflight checks for `\@limetry/web`.
 */

import {
  collectConfiguredTelemetry,
  envCheck,
  formatPreflightReport,
  isLoopbackHostname,
  isNextBuildPhase,
  isProductionRuntime,
  listEffectiveDotenvFiles,
  maskSecret,
  type PreflightCheck,
  resolvePublicListenUrl,
  runPreflight,
} from "@limetry/preflight"
import { APP_VERSION } from "@limetry/sdk"

import { loadWebEnv, type WebEnv } from "./env"
import { describeResolvedOrigin, resolveWebOrigins } from "./public-origins"

/**
 * Re-exports from `\@limetry/preflight` used by web scripts and config.
 */
export {
  formatPreflightReport,
  listEffectiveDotenvFiles,
  maskSecret,
  type PreflightCheck,
}

/**
 * Extracts hostname from an absolute URL, or `""` when parsing fails.
 *
 * @param value - Absolute URL string.
 * @returns Hostname or empty string.
 */
function hostnameOf(value: string): string {
  try {
    return new URL(value).hostname
  } catch {
    return ""
  }
}

/**
 * Builds env preflight checks for marketing-site public URLs and contact routing.
 *
 * @param env - Validated {@link WebEnv}.
 * @param source - Process env used for production/build phase detection.
 * @returns Ordered {@link PreflightCheck} list.
 */
export function collectWebEnvChecks(
  env: WebEnv,
  source: NodeJS.ProcessEnv = process.env,
): PreflightCheck[] {
  const requirePublicOrigins = isProductionRuntime(source) && !isNextBuildPhase(source)
  return [
    envCheck({
      name: "NEXT_PUBLIC_WEB_URL",
      value: env.NEXT_PUBLIC_WEB_URL,
      ok: !requirePublicOrigins || !isLoopbackHostname(hostnameOf(env.NEXT_PUBLIC_WEB_URL)),
      required: requirePublicOrigins,
    }),
    envCheck({
      name: "NEXT_PUBLIC_APP_URL",
      value: env.NEXT_PUBLIC_APP_URL,
      ok: !requirePublicOrigins || !isLoopbackHostname(hostnameOf(env.NEXT_PUBLIC_APP_URL)),
      required: requirePublicOrigins,
    }),
    envCheck({
      name: "NEXT_PUBLIC_API_URL",
      value: env.NEXT_PUBLIC_API_URL,
      ok: Boolean(env.NEXT_PUBLIC_API_URL),
      required: false,
      critical: false,
    }),
    envCheck({
      name: "NEXT_PUBLIC_GITHUB_URL",
      value: env.NEXT_PUBLIC_GITHUB_URL,
      ok: Boolean(env.NEXT_PUBLIC_GITHUB_URL),
      required: false,
      critical: false,
    }),
    envCheck({
      name: "NEXT_PUBLIC_DISCORD_URL",
      value: env.NEXT_PUBLIC_DISCORD_URL,
      ok: Boolean(env.NEXT_PUBLIC_DISCORD_URL),
      required: false,
      critical: false,
    }),
    envCheck({
      name: "NEXT_PUBLIC_CONTACT_FORM_URL",
      value: env.NEXT_PUBLIC_CONTACT_FORM_URL,
      ok: Boolean(env.NEXT_PUBLIC_CONTACT_FORM_URL),
      required: false,
      critical: false,
    }),
  ]
}

/**
 * Human-readable configuration lines for the preflight report.
 *
 * @param _env - Validated env (unused; origins come from `source`).
 * @param source - Process env for origin resolution.
 * @returns Report configuration lines.
 */
function webConfigurationLines(_env: WebEnv, source: NodeJS.ProcessEnv): string[] {
  const origins = resolveWebOrigins(source)
  return [
    `NODE_ENV: ${source.NODE_ENV ?? process.env.NODE_ENV ?? "development"}`,
    describeResolvedOrigin("NEXT_PUBLIC_WEB_URL", origins.web),
    describeResolvedOrigin("NEXT_PUBLIC_APP_URL", origins.app),
    describeResolvedOrigin("NEXT_PUBLIC_API_URL", origins.api),
  ]
}

/**
 * Runs full web product preflight (env, telemetry, listen URL).
 *
 * @param source - Process env; defaults to `process.env`.
 * @returns Completed preflight checks.
 */
export async function runWebPreflight(source: NodeJS.ProcessEnv = process.env): Promise<PreflightCheck[]> {
  const env = loadWebEnv(source)
  const telemetry = collectConfiguredTelemetry(source)
  return runPreflight({
    product: "Limetry Web",
    appVersion: APP_VERSION,
    env: source,
    envChecks: [...collectWebEnvChecks(env, source), ...telemetry.envChecks],
    configuration: [...webConfigurationLines(env, source), ...telemetry.configuration],
    probes: telemetry.probes,
    listenUrl: resolvePublicListenUrl(env.NEXT_PUBLIC_WEB_URL, source),
  })
}
