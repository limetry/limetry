/**
 * Delivers contact forms via a same-origin or configured contact API route.
 */

import type { ContactAdapter } from "./contact-types.js"

/**
 * Brevo contact adapter — posts to the site's contact API (server selects Brevo).
 */
export const brevoContactAdapter: ContactAdapter = {
  id: "brevo",
  async submit({ fields, config }) {
    try {
      const endpoint = config?.endpoint || "/api/contact"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      })
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        detail?: string
      }
      if (!response.ok || payload.ok === false) {
        return {
          ok: false,
          error: payload.error || "Unable to send the form. Please try again.",
        }
      }
      return {
        ok: true,
        detail: payload.detail,
      }
    } catch {
      return {
        ok: false,
        error: "Unable to send the form. Please try again.",
      }
    }
  },
}
