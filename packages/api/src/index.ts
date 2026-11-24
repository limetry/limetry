/**
 * `@limetry/api` — Limetry.org public HTTP API (Ask Limetry + contact).
 *
 * Also exports shared contact providers for Cloud BFF reuse.
 */

export { assistantRoutes, createChatRoutes } from "./assistant-routes.js"
export { resolveTurnstileSiteKey } from "./client/turnstile.js"
export {
  type ContactAdapterFactory,
  type ContactMailConfig,
  type ContactMessage,
  contactOptionsFromEnv,
  type ContactProvider,
  type ContactProviderId,
  type ContactProviderOptions,
  type ContactSendResult,
  createBrevoContactProvider,
  createContactProvider,
  createResendContactProvider,
  defaultContactAdapters,
  normalizeContactProviderId,
} from "./contact/index.js"
export { parseContactMessage } from "./contact/validate.js"
export { contactRoutes, createContactRoutes } from "./contact-routes.js"
export { createApiApp, createAssistantApp } from "./create-app.js"
export { getCachedApiApp, handler } from "./lambda.js"
export {
  logAssistantChatEvent,
  logContactSubmitEvent,
  putSiteAuditEvent,
  resolveSiteAuditHost,
  resolveSiteAuditRetentionDays,
  resolveSiteAuditTableName,
  type PutSiteAuditEventInput,
  type SiteAuditChannel,
  type SiteAuditDeps,
  siteTenantId,
  truncateSiteMetadata,
  tryPutSiteAuditEvent,
} from "./site-audit-log.js"
export {
  TURNSTILE_DUMMY_TOKEN,
  TURNSTILE_TEST_SECRET_PASS,
  TURNSTILE_TEST_SITEKEY_INVISIBLE,
} from "./turnstile/keys.js"
export {
  clientIpFromHeaders,
  consumeContactRateLimit,
  type ContactRateLimitOptions,
} from "./turnstile/rate-limit.js"
export {
  isTurnstileTestSecret,
  parseTurnstileHostnames,
  resolveTurnstileSecret,
  type TurnstileVerifyInput,
  type TurnstileVerifyResult,
  verifyTurnstileToken,
} from "./turnstile/verify.js"
