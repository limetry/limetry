"use client"

/**
 * Light / dark theme toggle for the marketing site chrome.
 *
 * Defers theme-dependent chrome until after hydration so `next-themes`
 * `resolvedTheme` (undefined on the server, filled from storage on the client)
 * cannot mismatch SSR HTML.
 */

import { ThemeToggle as SharedThemeToggle } from "@limetry/ui/theme-toggle"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

/**
 * Optional className for the theme toggle button.
 */
interface ThemeToggleProps {
  className?: string
}

const emptySubscribe = (): (() => void) => () => {}

/**
 * Client-only mount flag that stays false during SSR and hydration.
 *
 * @returns True after the client has hydrated.
 */
function useHasHydrated(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

/**
 * Sun/moon theme switcher for marketing chrome.
 *
 * @param props - Optional button className.
 * @returns Theme toggle button, or a same-size placeholder until hydrated.
 */
export function ThemeToggle({ className = "" }: ThemeToggleProps): React.JSX.Element {
  const { resolvedTheme, setTheme } = useTheme()
  const hasHydrated = useHasHydrated()

  if (!hasHydrated) {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex size-9 shrink-0 rounded-xl border border-transparent ${className}`}
      />
    )
  }

  return (
    <SharedThemeToggle
      resolvedTheme={resolvedTheme === "dark" ? "dark" : "light"}
      onToggle={() => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark")
      }}
      className={className}
    />
  )
}
