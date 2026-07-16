/**
 * `/pricing` sends visitors to Limetry Cloud (`NEXT_PUBLIC_APP_URL`).
 *
 * Implemented as a client redirect so static export (`LIMETRY_STATIC_EXPORT=1`)
 * can still open the portal hostname in a new navigation without a Next server.
 */

"use client"

import { useEffect } from "react"

import { siteUrls } from "@/lib/site-urls"

/**
 * Redirects to the Cloud portal origin baked in as `NEXT_PUBLIC_APP_URL`.
 *
 * @returns Brief fallback link while the browser navigates away.
 */
export default function PricingRedirectPage(): React.JSX.Element {
  useEffect(() => {
    window.location.replace(siteUrls.app)
  }, [])

  return (
    <main className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm text-muted-foreground">Opening Limetry Cloud…</p>
      <a
        href={siteUrls.app}
        className="text-sm font-semibold text-emerald-600 underline hover:text-emerald-500 dark:text-emerald-400"
      >
        Continue to {siteUrls.app.replace(/^https?:\/\//, "")}
      </a>
    </main>
  )
}
