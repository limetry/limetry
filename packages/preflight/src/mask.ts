/**
 * Secret and database URL redaction helpers for preflight banner display.
 */

const SECRET_PREFIXES = ["sk_live_", "sk_test_", "pk_live_", "pk_test_", "whsec_"] as const

const MASK = "•".repeat(10)

/**
 * Masks API keys / webhook secrets for banner display.
 *
 * Recognizes Stripe-style prefixes and generic `sk-` keys; otherwise returns a
 * full mask. Unset values render as `"(unset)"`.
 *
 * @param value - Raw secret string, or undefined when unset.
 * @returns Masked display string safe for logs and banners.
 */
export function maskSecret(value: string | undefined): string {
  if (!value) {
    return "(unset)"
  }
  for (const prefix of SECRET_PREFIXES) {
    if (value.startsWith(prefix)) {
      return `${prefix}${MASK}`
    }
  }
  if (value.startsWith("sk-")) {
    return `sk-${MASK}`
  }
  return MASK
}

/**
 * Splits a Postgres URL into display, host endpoint, and database name (no password).
 *
 * @param value - Connection string to parse.
 * @returns Display path without credentials, host endpoint, and database name.
 *          Invalid URLs return `"(invalid)"` / `"(none)"` placeholders.
 */
export function redactDatabaseUrl(value: string): {
  display: string
  endpoint: string
  name: string
} {
  try {
    const parsed = new URL(value)
    const endpoint = `${parsed.protocol}//${parsed.host}`
    const name = parsed.pathname.replace(/^\//, "")
    return {
      display: name ? `${endpoint}/${name}` : endpoint,
      endpoint,
      name: name || "(none)",
    }
  } catch {
    return {
      display: "(invalid)",
      endpoint: "(invalid)",
      name: "(none)",
    }
  }
}
