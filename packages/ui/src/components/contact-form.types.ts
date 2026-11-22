/**
 * Shared contact-form props for DOM and NativeWind implementations.
 */

export type ContactFormFields = {
  name: string
  email: string
  company?: string
  message: string
  source: string
  /** Cloudflare Turnstile token (invisible widget). */
  turnstileToken?: string
}

export type ContactFormProps = {
  className?: string
  idPrefix?: string
  /**
   * Analytics / attribution source stamped onto the submission payload.
   */
  source?: string
  /**
   * Compact layout for footer strips (two-column name/email, shorter message).
   */
  compact?: boolean
  /**
   * Public Turnstile sitekey. When set, an invisible challenge runs before submit.
   */
  turnstileSiteKey?: string
  /**
   * Turnstile action verified server-side (default `contact`).
   */
  turnstileAction?: string
  /**
   * Host-provided submit handler (posts to that site's contact API).
   */
  onSubmit: (fields: ContactFormFields) => Promise<void>
}
