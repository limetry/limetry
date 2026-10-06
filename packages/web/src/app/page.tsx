/**
 * Marketing home page: hero, value props, how-it-works, features, and examples.
 */

import type { Metadata } from "next"
import Link from "next/link"

import { ExamplesGrid } from "@/components/examples-grid"
import { FeatureTabs } from "@/components/feature-tabs"
import { Footer } from "@/components/footer"
import { Hero } from "@/components/hero"
import { HowItWorks } from "@/components/how-it-works"
import { SiteHeader } from "@/components/site-header"
import { documentTitle } from "@/lib/document-title"
import { siteUrls } from "@/lib/site-urls"

/**
 * Home page SEO metadata.
 */
export const metadata: Metadata = {
  title: documentTitle("Stop irreversible agent side effects"),
  description:
    "Gate agent tool calls before they run: evaluate, deny with reasons, and audit outcomes. MCP, CLI, and SDK for Cursor, Claude, and your frameworks.",
}

/**
 * Marketing home page composition.
 *
 * @returns Home page layout.
 */
export default function HomePage(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <ValueStrip />
        <HowItWorks />
        <FeatureTabs />
        <ExamplesGrid />
        <SelfHostCallout />
      </main>
      <Footer />
    </div>
  )
}

/**
 * Three-column evaluate / outcomes / audit value strip.
 *
 * @returns Value strip section.
 */
function ValueStrip(): React.JSX.Element {
  const items = [
    {
      title: "Check the action before it runs",
      body: "Every proposed tool call hits your policy server first — allowed types, resource patterns, cost caps, and approval gates. Not a prompt instruction.",
    },
    {
      title: "Outcomes you can enforce",
      body: "Allow continues. Deny blocks with reasons and a signed receipt. Approval-required waits for a human. Your loop still enforces the outcome.",
    },
    {
      title: "Audit trail you can tail",
      body: "Every decision writes a privacy-safe audit record. Operators see what policy did — not secrets, tokens, or chat transcripts.",
    },
  ]

  return (
    <section className="border-y border-border bg-card/40 py-14 sm:py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
        {items.map((item) => (
          <div key={item.title}>
            <h2 className="text-lg font-bold tracking-tight text-foreground">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/**
 * Bottom CTA promoting open-source self-run install.
 *
 * @returns Callout section.
 */
function SelfHostCallout(): React.JSX.Element {
  return (
    <section className="border-t border-border bg-card py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          Open source
        </div>
        <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          Install the stack. Run policy checks yourself.
        </h2>
        <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted-foreground">
          Limetry SDK, CLI, MCP, and the evaluation server ship together. Apply an action policy,
          check every agent action from your loop, and tail the audit trail on machines you control.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/docs/quick-start"
            className="whitespace-nowrap rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary/90"
          >
            Quick start →
          </Link>
          <Link
            href={siteUrls.github}
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap rounded-xl border border-border px-6 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            View on GitHub
          </Link>
        </div>
      </div>
    </section>
  )
}
