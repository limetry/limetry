"use client"

/**
 * OSS marketing contact form — shared UI + site submit helper.
 */

import { ContactForm as SharedContactForm } from "@limetry/ui/contact-form"

import { ContactSubmitError, submitContactMessage } from "@/lib/submit-contact"

type ContactFormProps = {
  className?: string
  idPrefix?: string
  source?: string
  compact?: boolean
}

/**
 * Contact form wired to limetry.org `/api/contact`.
 */
export function ContactForm({
  className,
  idPrefix = "contact",
  source = "contact-page",
  compact = false,
}: ContactFormProps): React.JSX.Element {
  return (
    <SharedContactForm
      className={className}
      idPrefix={idPrefix}
      source={source}
      compact={compact}
      onSubmit={async (fields) => {
        try {
          await submitContactMessage(fields)
        } catch (error) {
          throw error instanceof ContactSubmitError || error instanceof Error
            ? error
            : new ContactSubmitError("Could not send your message")
        }
      }}
    />
  )
}
