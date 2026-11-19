/**
 * Brevo transactional email adapter for contact-form submissions.
 */

import type {
  ContactMailConfig,
  ContactMessage,
  ContactProvider,
  ContactSendResult,
} from "./types.js"

/** @deprecated Prefer {@link ContactMailConfig}. */
export type BrevoContactConfig = ContactMailConfig

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
 * Builds a Brevo contact provider from env-backed config.
 *
 * @param config - API key and sender/inbox addresses.
 * @returns {@link ContactProvider} that posts to Brevo SMTP API.
 */
export function createBrevoContactProvider(
  config: ContactMailConfig,
): ContactProvider {
  return {
    id: "brevo",
    async send(message: ContactMessage): Promise<ContactSendResult> {
      const rows: Array<[string, string]> = [
        ["Name", message.name],
        ["Email", message.email],
      ]
      if (message.company) {
        rows.push(["Company", message.company])
      }
      if (message.source) {
        rows.push(["Source", message.source])
      }
      rows.push(["Message", message.message])

      const table = rows
        .map(([key, value]) => (
          `<tr><td style="padding:4px 12px 4px 0;font-weight:600;">${escapeHtml(key)}</td>`
          + `<td style="padding:4px 0;white-space:pre-wrap;">${escapeHtml(value)}</td></tr>`
        ))
        .join("")

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": config.apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: config.fromName,
            email: config.fromEmail,
          },
          to: [{ email: config.toEmail, name: "Limetry" }],
          replyTo: {
            email: message.email,
            name: message.name,
          },
          subject: `Contact form from ${message.name}`,
          htmlContent: `
            <p>New contact form submission from the website.</p>
            <table>${table}</table>
          `,
        }),
      })

      if (!response.ok) {
        const detail = await response.text().catch(() => "")
        return {
          ok: false,
          status: response.status,
          error: detail.slice(0, 280) || `Brevo responded with ${response.status}`,
        }
      }

      const payload = await response.json().catch(() => ({})) as {
        messageId?: string
      }
      return {
        ok: true,
        messageId: payload.messageId,
      }
    },
  }
}
