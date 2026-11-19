/**
 * Contact provider factory — select Brevo or Resend via CONTACT_PROVIDER.
 */

import { createBrevoContactProvider } from "./brevo.js"
import { createResendContactProvider } from "./resend.js"
import type { ContactProvider, ContactProviderId } from "./types.js"

export type {
  ContactMessage,
  ContactProvider,
  ContactProviderId,
  ContactSendResult,
} from "./types.js"

export { createBrevoContactProvider } from "./brevo.js"
export { createResendContactProvider } from "./resend.js"

/** Env keys used to resolve a contact provider. */
export type ContactProviderEnv = {
  CONTACT_PROVIDER?: string
  BREVO_API_KEY?: string
  BREVO_FROM_EMAIL?: string
  BREVO_FROM_NAME?: string
  BREVO_CONTACT_TO?: string
  RESEND_API_KEY?: string
  RESEND_FROM_EMAIL?: string
  RESEND_FROM_NAME?: string
  RESEND_CONTACT_TO?: string
}

/**
 * Normalizes a provider id string.
 *
 * @param value - Raw provider id.
 * @returns Lowercased id or empty string.
 */
export function normalizeContactProviderId(
  value: string | undefined | null,
): string {
  return String(value ?? "").trim().toLowerCase()
}

/**
 * Resolves the configured contact provider, or null when unset/incomplete.
 *
 * @param env - Process env (or subset) with provider credentials.
 * @returns Configured {@link ContactProvider}, or null.
 */
export function createContactProvider(
  env: ContactProviderEnv = process.env,
): ContactProvider | null {
  const id = (normalizeContactProviderId(env.CONTACT_PROVIDER) || "brevo") as ContactProviderId

  if (id === "resend") {
    const apiKey = env.RESEND_API_KEY?.trim()
    const fromEmail = env.RESEND_FROM_EMAIL?.trim()
    const toEmail = (env.RESEND_CONTACT_TO || fromEmail)?.trim()
    if (!apiKey || !fromEmail || !toEmail) {
      return null
    }
    return createResendContactProvider({
      apiKey,
      fromEmail,
      fromName: env.RESEND_FROM_NAME?.trim() || "Limetry",
      toEmail,
    })
  }

  const apiKey = env.BREVO_API_KEY?.trim()
  const fromEmail = env.BREVO_FROM_EMAIL?.trim()
  const toEmail = (env.BREVO_CONTACT_TO || fromEmail)?.trim()
  if (!apiKey || !fromEmail || !toEmail) {
    return null
  }
  return createBrevoContactProvider({
    apiKey,
    fromEmail,
    fromName: env.BREVO_FROM_NAME?.trim() || "Limetry",
    toEmail,
  })
}
