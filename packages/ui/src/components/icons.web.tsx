/**
 * Lucide icon wrappers for web / CSS class consumers.
 *
 * Uses `lucide-react` so stroke color follows Tailwind `className` utilities
 * without manual hex mapping.
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
} from "lucide-react"
import React from "react"
import { View } from "react-native"

import { cn } from "../lib/cn"

/**
 * Shared props for exported icon components.
 */
type IconProps = {
  /**
   * Tailwind classes applied to the wrapper and inherited by the SVG.
   */
  className?: string
}

/**
 * Renders a Lucide web icon inside a fixed-size React Native `View` wrapper.
 *
 * @param props - Lucide component and optional className.
 * @returns Icon wrapped for layout consistency with the native icon set.
 */
function WebIcon({
  Icon,
  className,
}: IconProps & {
  Icon: typeof Shield
}): React.JSX.Element {
  return (
    <View className={cn("h-5 w-5 items-center justify-center", className)}>
      <Icon className="h-5 w-5" />
    </View>
  )
}

/**
 * Shield / security icon for web surfaces.
 *
 * @param props - Optional className for layout and color.
 * @returns Web shield icon.
 */
export function ShieldIcon({ className }: IconProps): React.JSX.Element {
  return <WebIcon Icon={Shield} className={className} />
}

/**
 * Key / credentials icon for web surfaces.
 *
 * @param props - Optional className for layout and color.
 * @returns Web key icon.
 */
export function KeyIcon({ className }: IconProps): React.JSX.Element {
  return <WebIcon Icon={Key} className={className} />
}

/**
 * Rules / policy icon (Zap) for web surfaces.
 *
 * @param props - Optional className for layout and color.
 * @returns Web rules icon.
 */
export function RulesIcon({ className }: IconProps): React.JSX.Element {
  return <WebIcon Icon={Zap} className={className} />
}

/**
 * Chart / analytics icon for web surfaces.
 *
 * @param props - Optional className for layout and color.
 * @returns Web chart icon.
 */
export function ChartIcon({ className }: IconProps): React.JSX.Element {
  return <WebIcon Icon={BarChart} className={className} />
}

/**
 * User / account icon for web surfaces.
 *
 * @param props - Optional className for layout and color.
 * @returns Web user icon.
 */
export function UserIcon({ className }: IconProps): React.JSX.Element {
  return <WebIcon Icon={User} className={className} />
}

/**
 * Home / dashboard icon for web surfaces.
 *
 * @param props - Optional className for layout and color.
 * @returns Web home icon.
 */
export function HomeIcon({ className }: IconProps): React.JSX.Element {
  return <WebIcon Icon={Home} className={className} />
}

/**
 * Terminal / CLI icon for web surfaces.
 *
 * @param props - Optional className for layout and color.
 * @returns Web terminal icon.
 */
export function TerminalIcon({ className }: IconProps): React.JSX.Element {
  return <WebIcon Icon={Terminal} className={className} />
}

/**
 * Hamburger menu icon for web surfaces.
 *
 * @param props - Optional className for layout and color.
 * @returns Web menu icon.
 */
export function MenuIcon({ className }: IconProps): React.JSX.Element {
  return <WebIcon Icon={Menu} className={className} />
}

/**
 * Close / dismiss icon for web surfaces.
 *
 * @param props - Optional className for layout and color.
 * @returns Web close icon.
 */
export function XIcon({ className }: IconProps): React.JSX.Element {
  return <WebIcon Icon={X} className={className} />
}
