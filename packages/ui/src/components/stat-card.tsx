/**
 * Metric summary card with optional trend change and trailing icon.
 */

import type { ReactNode } from "react"
import { Text, View } from "react-native"

import { cn } from "../lib/cn"

/**
 * Props for {@link StatCard}.
 */
type StatCardProps = {
  /**
   * Short metric label above the value.
   */
  label: string
  /**
   * Primary numeric or string metric.
   */
  value: string | number
  /**
   * Optional change caption under the value (for example `"+12%"`).
   */
  change?: string
  /**
   * Colors the change caption; defaults to `"neutral"`.
   */
  trend?: "up" | "down" | "neutral"
  /**
   * Optional icon rendered opposite the label.
   */
  icon?: ReactNode
  /**
   * Extra classes on the card surface.
   */
  className?: string
}

const trendColors = {
  up: "text-emerald-500 dark:text-emerald-400",
  down: "text-red-500 dark:text-red-400",
  neutral: "text-slate-500 dark:text-slate-400",
}

/**
 * Dashboard metric tile showing label, value, and optional trend text.
 *
 * @param props - Label, value, optional change/trend/icon, and className.
 * @returns A bordered metric card.
 */
export function StatCard({
  label,
  value,
  change,
  trend = "neutral",
  icon,
  className,
}: StatCardProps): React.JSX.Element {
  return (
    <View
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900",
        className,
      )}
    >
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</Text>
        {icon ? <View className="opacity-80">{icon}</View> : null}
      </View>
      <Text className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        {value}
      </Text>
      {change ? (
        <Text className={cn("mt-2 text-xs font-medium", trendColors[trend])}>
          {change}
        </Text>
      ) : null}
    </View>
  )
}
