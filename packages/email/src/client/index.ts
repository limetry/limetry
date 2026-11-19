/**
 * Client-side contact-form adapters (browser / RN fetch).
 */

import { normalizeProviderId } from "./types.js"
import { brevoContactAdapter } from "./brevo.js"
import { formspreeContactAdapter } from "./formspree.js"
import { resendContactAdapter } from "./resend.js"
import type { ContactAdapter, ContactProviderId } from "./contact-types.js"

const contactAdapters: Record<ContactProviderId, ContactAdapter> = {
  brevo: brevoContactAdapter,
  formspree: formspreeContactAdapter,
  resend: resendContactAdapter,
}

/**
 * Resolves a contact-form adapter by provider id (case-insensitive).
 *
 * @param provider - Provider id from env or CMS.
 * @returns Matching adapter; defaults to Brevo.
 */
export function getContactAdapter(
  provider: string | undefined | null,
): ContactAdapter {
  const id = normalizeProviderId(provider) as ContactProviderId
  return contactAdapters[id] ?? contactAdapters.brevo
}

export type {
  ContactAdapter,
  ContactProviderId,
  ContactSubmitConfig,
  ContactSubmitInput,
} from "./contact-types.js"
export type { EmailProviderResult } from "./types.js"
export { normalizeProviderId } from "./types.js"
