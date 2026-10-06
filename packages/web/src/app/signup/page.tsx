/**
 * Get-started landing that points visitors at quick start and GitHub.
 */

import type { Metadata } from "next"
import Link from "next/link"

import { IconAccent } from "@/components/brand"
import { Footer } from "@/components/footer"
import { SiteHeader } from "@/components/site-header"
import { documentTitle } from "@/lib/document-title"
import { siteUrls } from "@/lib/site-urls"

/**
 * Get started page SEO metadata.
 */
export const metadata: Metadata = {
  title: documentTitle("Get started"),
  description: "Run Limetry in minutes: SDK, CLI, MCP, and the evaluation server.",
}

/**
 * Renders the Get started page.
 *
 * @returns Page layout.
 */
export default function SignupPage(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="relative flex-1 overflow-hidden py-16 sm:py-24">
        <IconAccent className="-right-40 top-16 h-110 w-110 opacity-[0.05] rotate-12" />
        <div className="relative mx-auto max-w-xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Get started</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Self-run Limetry today
          </h1>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground leading-relaxed">
            Run the open-source stack on your own machines. Apply an action policy, check agent
            actions, and tail the audit trail — usually in under five minutes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/docs/quick-start"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:-translate-y-0.5"
            >
              Quick start →
            </Link>
            <Link
              href={siteUrls.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-border px-6 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              View on GitHub
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
