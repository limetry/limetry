/**
 * limetry.org 404 — static export feeds CloudFront `/404.html`.
 */

import type { Metadata } from "next"
import Link from "next/link"

import { PageBrandBackground } from "@/components/brand"
import { Footer } from "@/components/footer"
import { SiteHeader } from "@/components/site-header"
import { documentTitle } from "@/lib/document-title"

export const metadata: Metadata = {
  title: documentTitle("Page not found"),
  robots: { index: false, follow: true },
}

/**
 * Branded not-found page for unknown marketing routes.
 */
export default function NotFound(): React.JSX.Element {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <PageBrandBackground />
      <SiteHeader />
      <main className="
        relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-20
        sm:px-6
        lg:px-8
      ">
        <p className="font-mono text-sm font-semibold tracking-[0.2em] text-primary uppercase">
          404
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          Policy denied: route not found
        </h1>
        <p className="mt-4 text-base/relaxed text-muted-foreground">
          We ran this URL through the governance engine. Verdict: DENY. Reason: no
          matching route in the allow-list — this path does not exist on limetry.org.
        </p>
        <p className="mt-3 text-sm/relaxed text-muted-foreground">
          Double-check the address, browse the docs, or head home. If a bookmark broke,
          the page may have moved — try the header navigation.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/"
            className="
              rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground
              hover:opacity-90
            "
          >
            Back to home
          </Link>
          <Link
            href="/docs"
            className="
              rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold
              text-foreground
              hover:bg-muted
            "
          >
            Browse docs
          </Link>
          <Link
            href="/contact"
            className="
              rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold
              text-foreground
              hover:bg-muted
            "
          >
            Contact
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
