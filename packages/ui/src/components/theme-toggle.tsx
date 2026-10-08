/**
 * Controlled sun/moon toggle for native consumers.
 */

import { Moon, Sun } from "lucide-react-native"
import { Pressable } from "react-native"

import { cn } from "../lib/cn"
import type { ThemeToggleProps } from "./theme-toggle.web"

/**
 * Renders the shared theme toggle contract for native consumers.
 *
 * @param props - Resolved theme, toggle callback, and optional classes.
 * @returns Theme toggle button.
 */
export function ThemeToggle({
  resolvedTheme,
  onToggle,
  className,
}: ThemeToggleProps): React.JSX.Element {
  const isDark = resolvedTheme === "dark"

  return (
    <Pressable
      accessibilityLabel={isDark ? "Switch to light mode" : "Switch to dark mode"}
      accessibilityRole="button"
      className={cn(
        "h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white active:opacity-80 dark:border-slate-700 dark:bg-slate-900",
        className,
      )}
      onPress={onToggle}
    >
      {isDark ? <Sun color="#94a3b8" size={18} strokeWidth={2} /> : <Moon color="#64748b" size={18} strokeWidth={2} />}
    </Pressable>
  )
}
