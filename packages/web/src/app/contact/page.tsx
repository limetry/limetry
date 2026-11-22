/**
 * Standalone contact page for limetry.org.
 */

import type { Metadata } from "next"

import { ContactForm } from "@/components/contact-form"
import { Footer } from "@/components/footer"
import { SiteHeader } from "@/components/site-header"
import { documentTitle } from "@/lib/document-title"

/**
 * Contact page SEO metadata.
 */
export const metadata: Metadata = {
  title: documentTitle("Contact"),
  description:
    "Contact the Limetry team about open-source Limetry, Limetry Cloud, docs, or partnerships.",
}

/**
 * Full contact page with header, form, and footer (no duplicate contact strip).
 *
 * @returns Contact page layout.
 */
export default function ContactPage(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <p className="text-sm font-semibold tracking-widest text-primary uppercase">
            Contact
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Get in touch
          </h1>
          <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
            Product questions, self-hosting help, Cloud workspaces, or partnerships — send a
            message. We&apos;ll point you to the right docs or plan.
          </p>
          <div className="mt-10 rounded-2xl border border-border bg-card/60 p-6 shadow-sm sm:p-8">
            <ContactForm source="contact-page" />
          </div>
        </div>
      </main>
      <Footer showContact={false} />
    </div>
  )
}
