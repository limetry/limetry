"use client"

/**
 * Client recovery from stale `/_next/static` chunk load failures.
 */

import { useEffect } from "react"

const RELOAD_KEY = "limetry-chunk-reload"
const RELOAD_COOLDOWN_MS = 10_000

/**
 * Detects known Next.js / Safari dynamic import chunk failure messages.
 *
 * @param message - Error or rejection message.
 * @returns `true` when a reload may recover a stale shell.
 */
function isChunkLoadFailure(message: string): boolean {
  return /Loading chunk|ChunkLoadError|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i.test(
    message,
  )
}

/**
 * Reloads the page at most once per cooldown window via sessionStorage.
 */
function reloadOnce(): void {
  try {
    const last = sessionStorage.getItem(RELOAD_KEY)
    if (last && Date.now() - Number(last) < RELOAD_COOLDOWN_MS) {
      return
    }
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    // sessionStorage may be unavailable; still attempt a single reload.
  }
  window.location.reload()
}

/**
 * Recovers from stale Safari/CloudFront documents that reference deleted
 * `/_next/static` chunks (blank shell until Private/cold cache).
 *
 * @returns `null` (side-effect only).
 */
export function ChunkLoadRecovery(): null {
  useEffect(() => {
    const onError = (event: ErrorEvent): void => {
      const message = event.message || String(event.error ?? "")
      if (isChunkLoadFailure(message)) {
        reloadOnce()
      }
    }
    const onRejection = (event: PromiseRejectionEvent): void => {
      const reason = event.reason
      const message = typeof reason === "string"
        ? reason
        : reason instanceof Error
          ? reason.message
          : String(reason ?? "")
      if (isChunkLoadFailure(message)) {
        reloadOnce()
      }
    }
    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onRejection)
    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onRejection)
    }
  }, [])

  return null
}
