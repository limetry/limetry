/**
 * `@limetry/api` — Limetry.org public HTTP API (Ask Limetry + contact).
 *
 * Also exports shared contact providers for Cloud BFF reuse.
 */

export { assistantRoutes, createChatRoutes } from "./assistant-routes.js"
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
