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
 * Shared mail credentials injected into every contact adapter.
 *
 * Provider-specific env prefixes are avoided — one set of from/to/key fields
 * is selected by {@link ContactProviderId}.
 */
export type ContactMailConfig = {
  apiKey: string
  fromEmail: string
  fromName: string
  toEmail: string
}

/**
 * Factory that builds a {@link ContactProvider} from shared mail config.
 */
export type ContactAdapterFactory = (config: ContactMailConfig) => ContactProvider

/**
 * Pluggable contact delivery backend.
 */
export interface ContactProvider {
  readonly id: ContactProviderId
  send(message: ContactMessage): Promise<ContactSendResult>
}
