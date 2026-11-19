/**
 * `@limetry/api` — Limetry.org public HTTP API (Ask Limetry + contact).
 *
 * Also exports shared contact providers for Cloud BFF reuse.
 */

export { assistantRoutes, createChatRoutes } from "./assistant-routes.js"
export { contactRoutes, createContactRoutes } from "./contact-routes.js"
export {
  createBrevoContactProvider,
  createContactProvider,
  createResendContactProvider,
  normalizeContactProviderId,
  type ContactMessage,
  type ContactProvider,
  type ContactProviderEnv,
  type ContactProviderId,
  type ContactSendResult,
} from "./contact/index.js"
export { parseContactMessage } from "./contact/validate.js"
export { createApiApp, createAssistantApp } from "./create-app.js"
export { getCachedApiApp, handler } from "./lambda.js"
