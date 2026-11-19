/**
 * Resend transactional email adapter for contact-form submissions.
 */

import type {
  ContactMessage,
  ContactProvider,
  ContactSendResult,
} from "./types.js"

export type ResendContactConfig = {
  apiKey: string
  fromEmail: string
  fromName: string
  toEmail: string
}

/**
 * Escapes HTML special characters for safe email bodies.
 *
 * @param value - Raw string.
 * @returns Escaped string.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * Builds a Resend contact provider from env-backed config.
 *
 * @param config - API key and sender/inbox addresses.
 * @returns {@link ContactProvider} that posts to Resend emails API.
 */
export function createResendContactProvider(
  config: ResendContactConfig,
): ContactProvider {
  return {
    id: "resend",
    async send(message: ContactMessage): Promise<ContactSendResult> {
      const lines = [
        `Name: ${message.name}`,
        `Email: ${message.email}`,
        message.company ? `Company: ${message.company}` : null,
        message.source ? `Source: ${message.source}` : null,
        "",
        message.message,
      ].filter((line): line is string => line !== null)

      const from = config.fromName
        ? `${config.fromName} <${config.fromEmail}>`
        : config.fromEmail

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [config.toEmail],
          reply_to: message.email,
          subject: `Contact form from ${message.name}`,
          text: lines.join("\n"),
          html: `<pre style="font-family:inherit;white-space:pre-wrap;">${escapeHtml(lines.join("\n"))}</pre>`,
        }),
      })

      if (!response.ok) {
        const detail = await response.text().catch(() => "")
        return {
          ok: false,
          status: response.status,
          error: detail.slice(0, 280) || `Resend responded with ${response.status}`,
        }
      }

      const payload = await response.json().catch(() => ({})) as { id?: string }
      return {
        ok: true,
        messageId: payload.id,
      }
    },
  }
}
