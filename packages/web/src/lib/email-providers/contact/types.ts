/**
 * Client-side contact-form adapter contract.
 */

import type { EmailProviderResult } from "../types"

/** Supported contact-form delivery backends. */
export type ContactProviderId = "brevo" | "formspree" | "resend"

/** Optional adapter config (Formspree form id, etc.). */
export type ContactSubmitConfig = {
  formspreeFormId?: string
  endpoint?: string
}

/** Fields submitted by the marketing contact form. */
export type ContactSubmitInput = {
  fields: Record<string, unknown>
  config?: ContactSubmitConfig
}

/**
 * Client adapter that posts contact fields to a provider endpoint.
 */
export type ContactAdapter = {
  readonly id: ContactProviderId
  submit: (input: ContactSubmitInput) => Promise<EmailProviderResult>
}
