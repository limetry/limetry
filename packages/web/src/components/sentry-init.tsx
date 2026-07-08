/**
 * Client-side Sentry bootstrap for the OSS marketing site (static export safe).
 */

"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

let initialized = false

/**
 * Initializes `@sentry/nextjs` in the browser when `NEXT_PUBLIC_SENTRY_DSN` is set.
 *
 * @returns Null render; side-effect only.
 */
export function SentryInit(): null {
  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
    if (!dsn || dsn.trim().length === 0 || initialized) {
      return
    }
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      debug: false,
    })
    initialized = true
  }, [])

  return null
}
