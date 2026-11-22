/**
 * limetry.org route error boundary.
 */

"use client"

import Link from "next/link"
import { useEffect } from "react"

import { PageBrandBackground } from "@/components/brand"
import { Footer } from "@/components/footer"
import { SiteHeader } from "@/components/site-header"

type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Catch-all error UI for OSS marketing routes.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps): React.JSX.Element {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <PageBrandBackground />
      <SiteHeader />
      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
        <p className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Error
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          Unexpected outcome in the audit trail
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Something tripped over its own tool call on our side. The request did not
          finish cleanly — this is not a policy deny from your rules.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Reload, try again in a minute, or contact us with the detail below so we can
          chase the audit event.
        </p>
        {error.digest || error.message ? (
          <pre className="mt-6 overflow-x-auto rounded-lg border border-border bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground">
            {error.digest ? `digest: ${error.digest}` : error.message}
          </pre>
        ) : null}
        <div className="mt-10 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Back to home
          </Link>
          <Link
            href="/contact"
            className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Contact
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
