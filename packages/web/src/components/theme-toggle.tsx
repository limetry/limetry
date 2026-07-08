"use client"

/**
 * Light / dark theme toggle for the marketing site chrome.
 */

import { useTheme } from "next-themes"

/**
 * Optional className for the theme toggle button.
 */
interface ThemeToggleProps {
  className?: string
}

/**
 * Sun/moon theme switcher for marketing chrome.
 *
 * @param props - Optional button className.
 * @returns Theme toggle button.
 */
export function ThemeToggle({ className = "" }: ThemeToggleProps): React.JSX.Element {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={`flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${className}`}
    >
      <SunIcon className="h-[1.1rem] w-[1.1rem] dark:hidden" />
      <MoonIcon className="hidden h-[1.1rem] w-[1.1rem] dark:block" />
    </button>
  )
}

function SunIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}
