/**
 * Examples gallery grouped by maturity (recommended, integration, reference).
 */

import type { Metadata } from "next"
import Link from "next/link"

import { Footer } from "@/components/footer"
import { SiteHeader } from "@/components/site-header"
import { githubPath } from "@/lib/site-urls"

import { type ExampleConfig,EXAMPLES, examplesByCategory } from "./examples"

/**
 * Examples gallery SEO metadata.
 */
export const metadata: Metadata = {
  title: "Examples — Limetry",
  description:
    "Reference agent loops for CI, Shopify, SQL, and common frameworks. Each evaluates before a side effect and writes privacy-safe audit.",
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Python: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "YAML / JSON": "bg-purple-500/10 text-purple-400 border-purple-500/20",
}

const MATURITY_LABEL: Record<ExampleConfig["maturity"], string> = {
  recommended: "Recommended",
  integration: "Integration",
  simulation: "Simulation",
  reference: "Reference",
}

/**
 * Card linking to one example detail page.
 *
 * @param props - Example config to display.
 * @returns Card link.
 */
function ExampleCard({ example }: { example: ExampleConfig }): React.JSX.Element {
  return (
    <Link
      href={`/examples/${example.slug}`}
      className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`rounded-lg border px-2 py-0.5 text-xs font-semibold ${LANG_COLORS[example.lang] ?? "bg-muted text-muted-foreground border-border"}`}
        >
          {example.lang}
        </span>
        <span className="text-xs text-muted-foreground">
          {MATURITY_LABEL[example.maturity]}
          {example.tested ? " · tested" : " · schema/manual"}
        </span>
      </div>
      <h2 className="mt-4 font-semibold text-foreground transition-colors group-hover:text-primary">
        {example.name}
      </h2>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        {example.description}
      </p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        View example
        <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </span>
    </Link>
  )
}

/**
 * Examples gallery grouped by maturity.
 *
 * @returns Examples page layout.
 */
export default function ExamplesPage(): React.JSX.Element {
  const { recommended, integrations, references } = examplesByCategory()
  const total = Object.keys(EXAMPLES).length

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Examples & Templates</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              Integration examples
            </h1>
            <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-muted-foreground">
              {total} copy-pasteable loops. Each one evaluates before a side effect, then audits the
              outcome. Fork one that matches your stack and adapt from there.
            </p>
          </div>

          <div className="space-y-12">
            <section>
              <h2 className="mb-4 text-xl font-bold tracking-tight text-foreground">
                Recommended setups
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recommended.map((example) => (
                  <ExampleCard key={example.slug} example={example} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-bold tracking-tight text-foreground">
                Framework Integrations & Workflows
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {integrations.map((example) => (
                  <ExampleCard key={example.slug} example={example} />
                ))}
              </div>
            </section>

            {references.length > 0 ? (
              <section>
                <h2 className="mb-4 text-xl font-bold tracking-tight text-foreground">
                  Reference Implementations
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {references.map((example) => (
                    <ExampleCard key={example.slug} example={example} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <div className="mt-16 text-center">
            <Link
              href={githubPath("/tree/main/examples")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-muted hover:shadow-md"
            >
              View all examples on GitHub
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
