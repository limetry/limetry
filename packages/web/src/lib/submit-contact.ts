/**
 * Client helper that submits the marketing contact form via the configured provider.
 */

import { getContactAdapter } from "@limetry/email/client"

export type ContactSubmitFields = {
  name: string
  email: string
  company?: string
  message: string
  source: string
}

/**
 * Error thrown when a contact submission fails.
 */
export class ContactSubmitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ContactSubmitError"
  }
}

/**
 * Submits a contact message through the active contact adapter.
 *
 * @param input - Form fields including analytics `source`.
 * @returns Resolves when the provider accepts the message.
 * @throws {@link ContactSubmitError} when the provider rejects the send.
 */
export async function submitContactMessage(
  input: ContactSubmitFields,
): Promise<void> {
  const adapter = getContactAdapter(
    process.env.NEXT_PUBLIC_CONTACT_PROVIDER || "brevo",
  )
  const result = await adapter.submit({
    fields: {
      name: input.name,
      email: input.email,
      message: input.message,
      source: input.source,
      ...(input.company ? { company: input.company } : {}),
    },
    config: {
      formspreeFormId: process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID,
      endpoint: process.env.NEXT_PUBLIC_CONTACT_API_URL || "/api/contact",
    },
  })
  if (!result.ok) {
    throw new ContactSubmitError(result.error || "Could not send your message")
  }
}
