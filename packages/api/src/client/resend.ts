/**
 * Resend contact adapter — same contact API endpoint; server selects Resend.
 */

import { brevoContactAdapter } from "./brevo.js"
import type { ContactAdapter } from "./contact-types.js"

/**
 * Resend uses the same server route; CONTACT_PROVIDER=resend on the API selects it.
 */
export const resendContactAdapter: ContactAdapter = {
  id: "resend",
  submit: brevoContactAdapter.submit,
}
