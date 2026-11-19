/**
 * Validates and normalizes contact-form JSON bodies.
 */

import type { ContactMessage } from "./types.js"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Parses a contact submission from an unknown JSON body.
 *
 * @param body - Raw request body.
 * @returns Normalized message or an error string.
 */
export function parseContactMessage(
  body: unknown,
): { ok: true, message: ContactMessage } | { ok: false, error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Expected a JSON object" }
  }
  const fields = body as Record<string, unknown>
  const name = typeof fields.name === "string" ? fields.name.trim() : ""
  const email = typeof fields.email === "string" ? fields.email.trim() : ""
  const message = typeof fields.message === "string" ? fields.message.trim() : ""
  const company = typeof fields.company === "string" ? fields.company.trim() : ""
  const source = typeof fields.source === "string" ? fields.source.trim() : ""

  if (name.length < 2 || name.length > 120) {
    return { ok: false, error: "Name is required (2–120 characters)" }
  }
  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return { ok: false, error: "A valid email is required" }
  }
  if (message.length < 10 || message.length > 5_000) {
    return { ok: false, error: "Message is required (10–5000 characters)" }
  }
  if (company.length > 160) {
    return { ok: false, error: "Company must be at most 160 characters" }
  }
  if (source.length > 80) {
    return { ok: false, error: "Source must be at most 80 characters" }
  }

  return {
    ok: true,
    message: {
      name,
      email,
      message,
      ...(company ? { company } : {}),
      ...(source ? { source } : {}),
    },
  }
}
