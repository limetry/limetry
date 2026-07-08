/**
 * Browser PostHog provider for the OSS marketing site.
 */

"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { type ReactNode, useEffect } from "react"

/**
 * Initializes PostHog once when `NEXT_PUBLIC_POSTHOG_KEY` is set.
 *
 * @param props - Provider children.
 * @returns PostHog React provider, or children when unconfigured.
 */
export function PostHogProvider({ children }: { children: ReactNode }): React.JSX.Element {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key || key.trim().length === 0) {
      return
    }
    if (posthog.__loaded) {
      return
    }
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: true,
      person_profiles: "identified_only",
    })
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
