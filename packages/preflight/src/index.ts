/**
 * Startup preflight checks for Limetry apps (`@limetry/preflight`).
 *
 * ## Env injection model
 *
 * This package is product-agnostic. It never assumes a Zod schema. Callers pass
 * an injected `source: NodeJS.ProcessEnv` (often defaulting to `process.env` at
 * the **call site only**). Helpers that already receive `source` must not read
 * ambient `process.env` again — that breaks tests and hides missing keys.
 *
 * Product adapters (web, servers) should:
 * 1. Parse a typed env object (Zod) for owned secrets/settings.
 * 2. Pass the same `source` bag into `runPreflight` / probes for deployment
 *    flags (`NODE_ENV`, `VERCEL_*`, `NEXT_PHASE`) and shared origin resolvers.
 *
 * @packageDocumentation
 */

export { connectivityIcon, envCheck } from "./checks.js"
export { annotated, listEffectiveDotenvFiles } from "./dotenv-files.js"
export {
  isNextBuildPhase,
  isProductionRuntime,
  isTestEnv,
  shouldFailHard,
  shouldProbeConnectivity,
} from "./env-runtime.js"
export { formatPreflightReport, PREFLIGHT_SEPARATOR } from "./format.js"
export {
  expandListenUrls,
  isLoopbackHostname,
  lanIPv4Addresses,
  resolvePublicListenUrl,
} from "./listen-urls.js"
export { createPreflightLogger, type Logger } from "./logger.js"
export { maskSecret, redactDatabaseUrl } from "./mask.js"
export {
  getAvailablePort,
  isPortInUse,
  resolveAvailablePort,
  resolveDevListenPort,
  type ResolvedPort,
} from "./ports.js"
export {
  createHttpProbe,
  type HttpHeaders,
  probeHttp,
  probeReachableOrigin,
} from "./probes/http.js"
export { createPostgresProbe, probePostgres } from "./probes/postgres.js"
export { createPosthogProbe, probePosthogDecide, resolvePosthogHost } from "./probes/posthog.js"
export { createRedisProbe, probeRedis } from "./probes/redis.js"
export {
  createSentryProbe,
  isSentryIngestReachableStatus,
  parseSentryDsn,
  probeSentryIngest,
  sentryEnvelopeUrl,
} from "./probes/sentry.js"
export { collectConfiguredTelemetry, type TelemetryBundle } from "./probes/telemetry.js"
export { runPreflight, type RunPreflightOptions } from "./run.js"
export {
  checkBlocksStartup,
  type ConnectivityProbe,
  type PreflightCheck,
  type PreflightCheckKind,
  type ProbeResult,
} from "./types.js"
