/**
 * Resend contact adapter — same `/api/contact` endpoint; server selects Resend.
 */

import { brevoContactAdapter } from "./brevo"
import type { ContactAdapter } from "./types"

/**
 * Resend uses the same server route; CONTACT_PROVIDER=resend on the API selects it.
 */
export const resendContactAdapter: ContactAdapter = {
  id: "resend",
  submit: brevoContactAdapter.submit,
}
