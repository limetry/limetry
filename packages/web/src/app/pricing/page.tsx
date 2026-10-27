/**
 * `/pricing` sends visitors to the Limetry Cloud marketing site (`NEXT_PUBLIC_CLOUD_WEB_URL`).
 *
 * Implemented as a client redirect so static export (`LIMETRY_STATIC_EXPORT=1`)
 * can still open the Cloud site in a new navigation without a Next server.
 */

"use client"

import { useEffect } from "react"

import { isLaunchOpen } from "@/lib/launching-soon"
import { siteUrls } from "@/lib/site-urls"

/**
 * Redirects to the Cloud marketing origin baked in as `NEXT_PUBLIC_CLOUD_WEB_URL`.
 *
 * @returns Brief fallback link while the browser navigates away.
 */
export default function PricingRedirectPage(): React.JSX.Element {
  useEffect(() => {
    window.location.replace(isLaunchOpen() ? `${siteUrls.cloudWeb}/pricing` : "/")
  }, [])

  if (!isLaunchOpen()) {
    return (
      <main className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-muted-foreground">Returning home…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm text-muted-foreground">Opening Limetry Cloud…</p>
      <a
        href={`${siteUrls.cloudWeb}/pricing`}
        className="text-sm font-semibold text-emerald-600 underline hover:text-emerald-500 dark:text-emerald-400"
      >
        Continue to {siteUrls.cloudWeb.replace(/^https?:\/\//, "")}/pricing
      </a>
    </main>
  )
}
