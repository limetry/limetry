import Link from "next/link"

import { Footer } from "@/components/footer"
import { SiteHeader } from "@/components/site-header"
import { siteUrls } from "@/lib/site-urls"

/** Compact, static landing page used at the API edge root. */
export function ApiLanding(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
          <p className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Limetry API
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-foreground sm:text-6xl">
            Govern agent actions before they run.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            The Limetry API evaluates tool calls, records signed decisions, and exposes an
            auditable control plane for your agent runtime.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/openapi"
              className="rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-sm"
            >
              OpenAPI reference →
            </Link>
            <Link
              href={`${siteUrls.web}/docs/quick-start`}
              className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted"
            >
              Quick start
            </Link>
          </div>
        </section>
        <section className="border-y border-border bg-card/40">
          <div className="mx-auto grid max-w-5xl gap-8 px-4 py-14 sm:grid-cols-3 sm:px-6 lg:px-8">
            {[
              ["Evaluate", "POST /v1/evaluate"],
              ["Authorizations", "GET /v1/authorizations"],
              ["Audit", "GET /v1/audit"],
            ].map(([title, endpoint]) => (
              <div key={endpoint}>
                <h2 className="font-semibold text-foreground">{title}</h2>
                <p className="mt-2 font-mono text-sm text-muted-foreground">{endpoint}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
