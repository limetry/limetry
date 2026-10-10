"use client"

/**
 * Light / dark theme toggle for the marketing site chrome.
 */

import { ThemeToggle as SharedThemeToggle } from "@limetry/ui/theme-toggle"
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
    <SharedThemeToggle
      resolvedTheme={resolvedTheme === "dark" ? "dark" : "light"}
      onToggle={() => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark")
      }}
      className={className}
    />
  )
}
