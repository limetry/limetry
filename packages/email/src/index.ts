/**
 * `@limetry/email` — shared server-side contact/email providers.
 */

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
