/**
 * Privacy policy page for limetry.com and related Limetry services.
 */

import type { Metadata } from "next"
import Link from "next/link"

import { IconAccent } from "@/components/brand"
import { Footer } from "@/components/footer"
import { SiteHeader } from "@/components/site-header"
import { siteUrls } from "@/lib/site-urls"

/**
 * Privacy Policy page SEO metadata.
 */
export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Limetry handles data for website visitors and self-run deployments.",
}

/**
 * Renders the Privacy Policy page.
 *
 * @returns Page layout.
 */
export default function PrivacyPage(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="relative flex-1 overflow-hidden py-16 sm:py-24">
        <IconAccent className="-right-40 top-16 h-[440px] w-[440px] opacity-[0.05] rotate-12" />
        <article className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Legal</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: July 27, 2026</p>

          <div className="prose prose-neutral mt-10 max-w-none dark:prose-invert prose-headings:font-bold prose-p:text-muted-foreground prose-li:text-muted-foreground">
            <h2>Overview</h2>
            <p>
              Limetry evaluates agent actions against policies you define. When you run Limetry
              yourself, evaluation and audit data stay on systems you control unless you send them
              elsewhere. This website (limetry.com) is separate from your evaluation server.
            </p>

            <h2>What we collect</h2>
            <ul>
              <li>
                <strong>Self-run deployments:</strong> policies, evaluation results, and audit
                events in your store. We do not receive this data unless you configure external
                telemetry or grant support access.
              </li>
              <li>
                <strong>Website:</strong> standard analytics and logs for limetry.com (see cookie
                notices when applicable).
              </li>
              <li>
                <strong>Optional third-party services you configure:</strong> if you enable your own
                analytics, error reporting, or other integrations on a Limetry deployment or this
                site, those providers process data under their terms.
              </li>
            </ul>

            <h2>Action intents and free-form fields</h2>
            <p>
              Evaluate and record APIs accept structured fields such as <code>action_type</code>,{" "}
              <code>resource</code>, optional <code>metadata</code>, and (on record){" "}
              <code>details</code>. Free-form fields can contain whatever the calling agent sends.
              Limetry is not a chat logger and does not require transcripts. Integrators should send
              only fields needed for policy decisions.
            </p>
            <p>
              Before audit retention, Limetry scrubs known secret key names, strips URL query/userinfo
              from <code>resource</code>, and defaults to <code>audit_mode=minimal</code> (decision
              projection only). Set <code>audit_mode=forensics</code> on a policy when you need
              redacted metadata/details for investigations. See the{" "}
              <Link href="/docs/server/data-minimization" className="text-primary underline hover:no-underline">
                data minimization guide
              </Link>
              .
            </p>

            <h2>What we do not do</h2>
            <p>
              Limetry does not custody funds, hold private keys on your behalf, or execute payments.
              We do not sell personal data.
            </p>

            <h2>How we use data</h2>
            <p>
              For this website, we use collected data to operate limetry.com, improve reliability,
              respond to support requests, and meet legal obligations. For self-run deployments,
              you control how data on your systems is used.
            </p>

            <h2>Retention</h2>
            <p>
              Retention on systems you control is configured by you (for example{" "}
              <code>LIMETRY_AUDIT_RETENTION_DAYS</code>). Website analytics retention follows the
              tools configured for limetry.com.
            </p>

            <h2>Contact</h2>
            <p>
              For privacy questions, please use the{" "}
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
