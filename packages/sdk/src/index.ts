/**
 * Public entry for `\@limetry/sdk`.
 *
 * Re-exports policy engine clients, typed policy/intent contracts, privacy
 * helpers for audit projections, and Limetry error classes used by adapters
 * (`\@limetry/ci`, `\@limetry/sql`, `\@limetry/shopify`) and CLI/MCP tooling.
 *
 * @packageDocumentation
 */

export { APP_VERSION } from "./app-version.js"
export { COMPATIBILITY } from "./compatibility.js"
export type { PolicyEngine } from "./engine/policy-engine.js"
export type { RemotePolicyEngineOptions } from "./engine/remote-engine.js"
export { createRemoteEngine,RemotePolicyEngine } from "./engine/remote-engine.js"
export {
  EngineLoadError,
  LimetryError,
  PaymentInterceptionError,
  PolicyViolationError,
  RateLimitExceededError,
} from "./errors.js"
export {
  createSlimActionPolicy,
  createSlimPolicy,
  type SlimActionPolicyInput,
  type SlimPolicyInput,
} from "./policy/slim-policy.js"
export {
  type AuditIntentProjection,
  type AuditMode,
  buildEvaluatedAuditDetails,
  buildMinimizedAuthorizationRequest,
  buildMinimizedAuthorizationResponse,
  buildRecordedAuditDetails,
  DEFAULT_AUDIT_MODE,
  isSensitiveKey,
  projectIntentForAudit,
  redactActionIntent,
  redactDetails,
  redactMetadata,
  resolveAuditMode,
  scrubEmbeddedSecrets,
  scrubResource,
} from "./privacy/redact.js"
export type * from "./types.js"
export {
  DEFAULT_LIMETRY_BASE_URL,
  DEFAULT_LIMETRY_CLOUD_BASE_URL,
  LIMETRY_CLOUD_APP_ORIGIN,
  LIMETRY_CLOUD_ORIGINS,
  LIMETRY_OSS_ORIGINS,
  resolveLimetryBaseUrl,
  resolveLimetryCloudBaseUrl,
} from "./urls.js"
