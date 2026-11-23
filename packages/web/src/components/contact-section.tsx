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
      className="border-t border-slate-200 bg-linear-to-br from-emerald-500/6 via-white to-cyan-500/5 dark:border-slate-800 dark:from-emerald-400/8 dark:via-slate-950 dark:to-cyan-400/6"
    >
      <div className="
        mx-auto grid max-w-7xl gap-8 px-4 py-12
        sm:px-6
        lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start lg:gap-12 lg:px-8 lg:py-14
      ">
        <div className="max-w-md">
          <p className="
            text-xs font-semibold tracking-widest text-emerald-600 uppercase
            dark:text-emerald-400
          ">
            Contact
          </p>
          <h2
            id="contact-strip-heading"
            className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl"
          >
            Talk to the Limetry team
          </h2>
          <p className="mt-3 text-sm/relaxed text-slate-500 dark:text-slate-400">
            Questions about self-run Limetry, Limetry Cloud, or partnerships — send a note.
            &nbsp;
            <Link
              href="/contact"
              className="font-medium text-emerald-600 underline-offset-4 hover:underline dark:text-emerald-400"
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
          className="
            rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm
            sm:p-6
            dark:border-slate-700/80 dark:bg-slate-900/80
          "
        />
      </div>
    </section>
  )
}
