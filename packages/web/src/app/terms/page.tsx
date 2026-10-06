/**
 * Terms of service page for limetry.com and related Limetry services.
 */

import type { Metadata } from "next"
import Link from "next/link"

import { IconAccent } from "@/components/brand"
import { Footer } from "@/components/footer"
import { SiteHeader } from "@/components/site-header"
import { documentTitle } from "@/lib/document-title"
import { siteUrls } from "@/lib/site-urls"

/**
 * Terms of Service page SEO metadata.
 */
export const metadata: Metadata = {
  title: documentTitle("Terms of Service"),
  description: "Terms for using Limetry open-source software and this website.",
}

/**
 * Renders the Terms of Service page.
 *
 * @returns Page layout.
 */
export default function TermsPage(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="relative flex-1 overflow-hidden py-16 sm:py-24">
        <IconAccent className="-right-40 top-16 h-110 w-110 opacity-[0.05] rotate-12" />
        <article className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Legal</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: July 21, 2026</p>

          <div className="prose prose-neutral mt-10 max-w-none dark:prose-invert prose-headings:font-bold prose-p:text-muted-foreground prose-li:text-muted-foreground">
            <h2>Agreement</h2>
            <p>
              By using Limetry open-source software or this website, you agree to these terms. If
              you do not agree, do not use the software or site.
            </p>

            <h2>Open-source software</h2>
            <p>
              The Limetry repository is released under the MIT License. You may use, modify, and
              distribute it subject to that license. The software is provided &quot;as is&quot; without
              warranty.
            </p>

            <h2>What Limetry provides</h2>
            <p>
              Limetry checks action intents against policies you configure and records privacy-safe
              audit events. Decisions are advisory unless you enforce them in your agent middleware
              or CI jobs. Limetry does not custody funds, hold payment credentials, or guarantee that
              agents cannot bypass evaluation.
            </p>

            <h2>Optional third-party services</h2>
            <p>
              You may connect optional third-party services (analytics, platforms, and databases you
              choose) that you configure yourself. Those providers are governed by their own terms.
              Limetry does not control data you send to services you choose to enable.
            </p>

            <h2>Acceptable use</h2>
            <p>
              You may not use Limetry to violate law, infringe others&apos; rights, or attempt to
              compromise systems you do not own or have permission to test.
            </p>

            <h2>Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, Limetry and its contributors are not liable for
              indirect, incidental, or consequential damages, including unauthorized agent actions or
              financial loss from misconfigured policies.
            </p>

            <h2>Contact</h2>
            <p>
              For legal inquiries, please use the{" "}
              <Link href={siteUrls.contactUrl} className="text-primary underline hover:no-underline">
                contact form
              </Link>
              .
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  )
}
