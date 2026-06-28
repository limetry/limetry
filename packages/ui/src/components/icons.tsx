/**
 * Lucide icon wrappers for React Native / NativeWind consumers.
 *
 * Resolves stroke color from Tailwind text classes via the active color scheme
 * because `lucide-react-native` expects a `color` prop rather than CSS classes.
 */

import {
  BarChart,
  Home,
  Key,
  Menu,
  Shield,
  Terminal,
  User,
  X,
  Zap,
} from "lucide-react-native"
import { useColorScheme } from "nativewind"
import React from "react"
import { View } from "react-native"

import { cn } from "../lib/cn"

/**
 * Shared props for exported icon components.
 */
type IconProps = {
  /**
   * Tailwind / NativeWind classes that may encode text color for stroke resolution.
   */
  className?: string
}

/**
 * Maps known text utility classes to hex stroke colors for Lucide native icons.
 *
 * @param className - Optional class string that may include color utilities.
 * @param isDark - Whether the active NativeWind scheme is dark.
 * @returns Hex color string for the Lucide `color` prop.
 */
function getColorFromClass(className: string | undefined, isDark: boolean): string {
  if (!className) return isDark ? "#ffffff" : "#0f172a"
  if (className.includes("text-emerald-500")) return "#10B981"
  if (className.includes("text-slate-400")) return "#94A3B8"
  if (className.includes("text-slate-900")) return "#0f172a"
  if (className.includes("text-slate-100")) return "#ffffff"
  if (className.includes("dark:text-slate-100")) return isDark ? "#ffffff" : "#0f172a"
  if (className.includes("dark:text-slate-500")) return isDark ? "#6B7280" : "#94A3B8"
  return isDark ? "#ffffff" : "#0f172a"
}

/**
 * Renders a Lucide native icon inside a fixed-size view with scheme-aware color.
 *
 * @param props - Lucide component and optional className.
 * @returns Icon wrapped in a sizing `View`.
 */
function NativeIcon({
  Icon,
  className,
}: IconProps & {
  Icon: typeof Shield
}): React.JSX.Element {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === "dark"
  const color = getColorFromClass(className, isDark)

  return (
    <View className={cn("h-6 w-6 items-center justify-center", className)}>
      <Icon color={color} size={20} />
    </View>
  )
}

/**
 * Shield / security icon for native surfaces.
 *
 * @param props - Optional className for layout and color hints.
 * @returns Native shield icon.
 */
export function ShieldIcon({ className }: IconProps): React.JSX.Element {
  return <NativeIcon Icon={Shield} className={className} />
}

/**
 * Key / credentials icon for native surfaces.
 *
 * @param props - Optional className for layout and color hints.
 * @returns Native key icon.
 */
export function KeyIcon({ className }: IconProps): React.JSX.Element {
  return <NativeIcon Icon={Key} className={className} />
}

/**
 * Rules / policy icon (Zap) for native surfaces.
 *
 * @param props - Optional className for layout and color hints.
 * @returns Native rules icon.
 */
export function RulesIcon({ className }: IconProps): React.JSX.Element {
  return <NativeIcon Icon={Zap} className={className} />
}

/**
 * Chart / analytics icon for native surfaces.
 *
 * @param props - Optional className for layout and color hints.
 * @returns Native chart icon.
 */
export function ChartIcon({ className }: IconProps): React.JSX.Element {
  return <NativeIcon Icon={BarChart} className={className} />
}

/**
 * User / account icon for native surfaces.
 *
 * @param props - Optional className for layout and color hints.
 * @returns Native user icon.
 */
export function UserIcon({ className }: IconProps): React.JSX.Element {
  return <NativeIcon Icon={User} className={className} />
}

/**
 * Home / dashboard icon for native surfaces.
 *
 * @param props - Optional className for layout and color hints.
 * @returns Native home icon.
 */
export function HomeIcon({ className }: IconProps): React.JSX.Element {
  return <NativeIcon Icon={Home} className={className} />
}

/**
 * Terminal / CLI icon for native surfaces.
 *
 * @param props - Optional className for layout and color hints.
 * @returns Native terminal icon.
 */
export function TerminalIcon({ className }: IconProps): React.JSX.Element {
  return <NativeIcon Icon={Terminal} className={className} />
}

/**
 * Hamburger menu icon for native surfaces.
 *
 * @param props - Optional className for layout and color hints.
 * @returns Native menu icon.
 */
export function MenuIcon({ className }: IconProps): React.JSX.Element {
  return <NativeIcon Icon={Menu} className={className} />
}

/**
 * Close / dismiss icon for native surfaces.
 *
 * @param props - Optional className for layout and color hints.
 * @returns Native close icon.
 */
export function XIcon({ className }: IconProps): React.JSX.Element {
  return <NativeIcon Icon={X} className={className} />
}
