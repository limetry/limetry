"use client"

/**
 * Controlled sun/moon toggle used by every Limetry web header.
 *
 * Icon and chrome follow {@link ThemeToggleProps.resolvedTheme} directly so Expo
 * web (where `bg-card` is a light-only token and `dark:` icon swaps look inverted)
 * matches the native toggle: sun in dark mode, moon in light mode.
 */

import type { JSX } from "react"

import { cn } from "../lib/cn"

export type ThemeToggleProps = {
  /** Current resolved theme. */
  resolvedTheme: "light" | "dark"
  /** Switches to the opposite resolved theme. */
  onToggle: () => void
  /** Optional classes for the control. */
  className?: string
}

/**
 * Renders the shared OSS-style light/dark theme control.
 *
 * @param props - Resolved theme, toggle callback, and optional classes.
 * @returns Theme toggle button.
 */
export function ThemeToggle({
  resolvedTheme,
  onToggle,
  className = "",
}: ThemeToggleProps): JSX.Element {
  const isDark = resolvedTheme === "dark"

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={onToggle}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
        isDark
          ? "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900",
        className,
      )}
    >
      {isDark ? (
        <SunIcon className="h-[1.1rem] w-[1.1rem]" />
      ) : (
        <MoonIcon className="h-[1.1rem] w-[1.1rem]" />
      )}
    </button>
  )
}

function SunIcon({ className }: { className?: string }): JSX.Element {
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

function MoonIcon({ className }: { className?: string }): JSX.Element {
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
