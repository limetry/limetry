/**
 * Formspree contact adapter for static-only fallbacks without a Brevo backend.
 */

import type { ContactAdapter } from "./types"

/**
 * Posts contact fields directly to Formspree when configured.
 */
export const formspreeContactAdapter: ContactAdapter = {
  id: "formspree",
  async submit({ fields, config }) {
    const formId = config?.formspreeFormId
      || process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID
      || ""
    if (!formId) {
      return {
        ok: false,
        error: "Formspree is not configured for this site",
      }
    }
    try {
      const response = await fetch(`https://formspree.io/f/${formId}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fields),
      })
      if (!response.ok) {
        return {
          ok: false,
          error: "Unable to send the form. Please try again.",
        }
      }
      return { ok: true, detail: "Contact form sent via Formspree" }
    } catch {
      return {
        ok: false,
        error: "Unable to send the form. Please try again.",
      }
    }
  },
}
