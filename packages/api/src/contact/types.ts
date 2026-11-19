/**
 * Server-side contact-form delivery contract (Brevo today; Resend swappable).
 */

/** Supported contact delivery backends. */
export type ContactProviderId = "brevo" | "resend"

/** Validated contact-form submission. */
export type ContactMessage = {
  name: string
  email: string
  company?: string
  message: string
  source?: string
}

/** Result of a contact send attempt. */
export type ContactSendResult = {
  ok: true
  messageId?: string
} | {
  ok: false
  error: string
  status?: number
}

/**
 * Pluggable contact delivery backend.
 */
export interface ContactProvider {
  readonly id: ContactProviderId
  send(message: ContactMessage): Promise<ContactSendResult>
}
