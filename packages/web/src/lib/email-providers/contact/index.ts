/**
 * Resolves a client-side contact adapter by provider id.
 */

import { normalizeProviderId } from "../types"
import { brevoContactAdapter } from "./brevo"
import { formspreeContactAdapter } from "./formspree"
import { resendContactAdapter } from "./resend"
import type { ContactAdapter, ContactProviderId } from "./types"

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
} from "./types"
