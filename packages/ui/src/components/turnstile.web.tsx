"use client"

/**
 * Invisible Cloudflare Turnstile helper for DOM forms.
 */

import { useCallback, useEffect, useRef } from "react"

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
const SCRIPT_ID = "cf-turnstile-script"

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      size: "invisible"
      callback: (token: string) => void
      "error-callback"?: () => void
      "expired-callback"?: () => void
      action?: string
      appearance?: "always" | "execute" | "interaction-only"
      execution?: "render" | "execute"
    },
  ) => string
  execute: (widgetId: string) => void
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

export type TurnstileInvisibleProps = {
  /** Public sitekey (use Cloudflare test key in local/dev when unset upstream). */
  siteKey: string
  /** Action string verified server-side (1–32 chars). */
  action: string
}

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve()
  }
  if (window.turnstile) {
    return Promise.resolve()
  }
  const existing = document.getElementById(SCRIPT_ID)
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("Turnstile script failed")), {
        once: true,
      })
    })
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.id = SCRIPT_ID
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Turnstile script failed to load"))
    document.head.appendChild(script)
  })
}

/**
 * Hook that mints an invisible Turnstile token on demand.
 *
 * @param props - Sitekey and action.
 * @returns `getToken()` and a hidden mount node ref host element.
 */
export function useInvisibleTurnstile(
  props: TurnstileInvisibleProps,
): {
  getToken: (siteKeyOverride?: string) => Promise<string>
  containerRef: React.RefObject<HTMLDivElement | null>
} {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const renderedSiteKeyRef = useRef<string>("")
  const pendingRef = useRef<{
    resolve: (token: string) => void
    reject: (error: Error) => void
  } | null>(null)

  useEffect(() => {
    return () => {
      const api = window.turnstile
      const id = widgetIdRef.current
      if (api && id) {
        try {
          api.remove(id)
        } catch {
          // ignore
        }
      }
      widgetIdRef.current = null
    }
  }, [])

  const getToken = useCallback(async (siteKeyOverride?: string): Promise<string> => {
    const siteKey = (siteKeyOverride || props.siteKey || "").trim()
    if (!siteKey) {
      throw new Error("Turnstile site key is not configured")
    }
    await loadTurnstileScript()
    const api = window.turnstile
    const container = containerRef.current
    if (!api || !container) {
      throw new Error("Turnstile is not available")
    }
    if (widgetIdRef.current && renderedSiteKeyRef.current !== siteKey) {
      try {
        api.remove(widgetIdRef.current)
      } catch {
        // ignore
      }
      widgetIdRef.current = null
    }
    if (!widgetIdRef.current) {
      widgetIdRef.current = api.render(container, {
        sitekey: siteKey,
        size: "invisible",
        execution: "execute",
        appearance: "execute",
        action: props.action,
        callback: (token) => {
          pendingRef.current?.resolve(token)
          pendingRef.current = null
        },
        "error-callback": () => {
          pendingRef.current?.reject(new Error("Turnstile challenge failed"))
          pendingRef.current = null
        },
        "expired-callback": () => {
          pendingRef.current?.reject(new Error("Turnstile token expired — try again"))
          pendingRef.current = null
        },
      })
      renderedSiteKeyRef.current = siteKey
    }
    const widgetId = widgetIdRef.current
    return new Promise<string>((resolve, reject) => {
      pendingRef.current = { resolve, reject }
      try {
        api.reset(widgetId)
        api.execute(widgetId)
      } catch (error) {
        pendingRef.current = null
        reject(error instanceof Error ? error : new Error("Turnstile execute failed"))
      }
    })
  }, [props.action, props.siteKey])

  return { getToken, containerRef }
}

/**
 * Hidden mount point for an invisible Turnstile widget (render next to the form).
 */
export function TurnstileInvisibleMount({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
}): React.JSX.Element {
  return (
    <div
      ref={containerRef}
      className="h-0 w-0 absolute overflow-hidden opacity-0"
      aria-hidden
    />
  )
}
