/**
 * Brief full-width contact strip shown near the bottom of public pages.
 */

import Link from "next/link"

import { ContactForm } from "@/components/contact-form"

type ContactSectionProps = {
  /**
   * Analytics source label for submissions from this strip.
   */
  source?: string
}

/**
 * Compact contact CTA + form placed above the site footer.
 *
 * @param props - Optional analytics source override.
 * @returns Full-width contact section.
 */
export function ContactSection({
  source = "site-footer-strip",
}: ContactSectionProps): React.JSX.Element {
  return (
    <section
      aria-labelledby="contact-strip-heading"
      className="border-t border-border bg-gradient-to-br from-emerald-500/[0.06] via-card to-cyan-500/[0.05]"
    >
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start lg:gap-12 lg:px-8 lg:py-14">
        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Contact
          </p>
          <h2
            id="contact-strip-heading"
            className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            Talk to the Limetry team
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Questions about self-run Limetry, Limetry Cloud, or partnerships — send a note.
            Prefer a full page?{" "}
            <Link
              href="/contact"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Open contact
            </Link>
            .
          </p>
        </div>
        <ContactForm
          idPrefix="strip-contact"
          source={source}
          compact
          className="rounded-2xl border border-border/80 bg-background/80 p-5 shadow-sm backdrop-blur-sm sm:p-6"
        />
      </div>
    </section>
  )
}
