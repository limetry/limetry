/**
 * Contact provider factory — DI adapters selected by CONTACT_PROVIDER.
 */

import { createBrevoContactProvider } from "./brevo.js"
import { createResendContactProvider } from "./resend.js"
import type {
  ContactAdapterFactory,
  ContactMailConfig,
  ContactProvider,
  ContactProviderId,
} from "./types.js"

export { createBrevoContactProvider } from "./brevo.js"
export { createResendContactProvider } from "./resend.js"
export type {
  ContactAdapterFactory,
  ContactMailConfig,
  ContactMessage,
  ContactProvider,
  ContactProviderId,
  ContactSendResult,
} from "./types.js"

/** Default adapter registry (Brevo + Resend). */
export const defaultContactAdapters: Record<
  ContactProviderId,
  ContactAdapterFactory
> = {
  brevo: createBrevoContactProvider,
  resend: createResendContactProvider,
}

/**
 * Host-injected contact options (no provider-prefixed duplicates).
 */
export type ContactProviderOptions = {
  provider?: string | null
  apiKey?: string | null
  fromEmail?: string | null
  fromName?: string | null
  toEmail?: string | null
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
 * Maps shared CONTACT_* process env into {@link ContactProviderOptions}.
 *
 * @param env - Process env (or subset).
 * @returns Options for {@link createContactProvider}.
 */
export function contactOptionsFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): ContactProviderOptions {
  return {
    provider: env.CONTACT_PROVIDER,
    apiKey: env.CONTACT_API_KEY,
    fromEmail: env.CONTACT_FROM_EMAIL,
    fromName: env.CONTACT_FROM_NAME,
    toEmail: env.CONTACT_TO_EMAIL,
  }
}

/**
 * Resolves a contact provider via the adapter registry, or null when incomplete.
 *
 * @param options - Shared mail credentials + provider id.
 * @param adapters - Optional DI override of adapter factories (tests / custom backends).
 * @returns Configured {@link ContactProvider}, or null.
 */
export function createContactProvider(
  options: ContactProviderOptions,
  adapters: Partial<Record<ContactProviderId, ContactAdapterFactory>> = defaultContactAdapters,
): ContactProvider | null {
  const id = (normalizeContactProviderId(options.provider) || "brevo") as ContactProviderId
  const factory = adapters[id]
  if (!factory) {
    return null
  }

  const apiKey = options.apiKey?.trim()
  const fromEmail = options.fromEmail?.trim()
  const toEmail = (options.toEmail || options.fromEmail)?.trim()
  const fromName = options.fromName?.trim() || "Limetry"
  if (!apiKey || !fromEmail || !toEmail) {
    return null
  }

  const config: ContactMailConfig = {
    apiKey,
    fromEmail,
    fromName,
    toEmail,
  }
  return factory(config)
}
