/**
 * Page chrome helpers: headers, empty placeholders, and alert banners.
 */

import type { ReactNode } from "react"
import { Text, View } from "react-native"

import { cn } from "../lib/cn"

/**
 * Props for {@link PageHeader}.
 */
type PageHeaderProps = {
  /**
   * Page title.
   */
  title: string
  /**
   * Optional subtitle under the title.
   */
  description?: string
  /**
   * Optional trailing action (for example a primary button).
   */
  action?: ReactNode
  /**
   * Extra classes on the header row.
   */
  className?: string
}

/**
 * Top-of-page title row with optional description and action slot.
 *
 * @param props - Title, description, action, and className.
 * @returns A page header row.
 */
export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps): React.JSX.Element {
  return (
    <View className={cn("mb-6 flex-row items-start justify-between", className)}>
      <View className="flex-1 pr-4">
        <Text className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-3xl">
          {title}
        </Text>
        {description ? (
          <Text className="mt-1 text-base text-slate-500 dark:text-slate-400">{description}</Text>
        ) : null}
      </View>
      {action}
    </View>
  )
}

/**
 * Props for {@link EmptyState}.
 */
type EmptyStateProps = {
  /**
   * Empty-state heading.
   */
  title: string
  /**
   * Supporting explanation centered under the title.
   */
  description: string
  /**
   * Optional CTA rendered below the description.
   */
  action?: ReactNode
}

/**
 * Dashed placeholder for lists or tables with no rows yet.
 *
 * @param props - Title, description, and optional action.
 * @returns A centered empty-state block.
 */
export function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps): React.JSX.Element {
  return (
    <View className="items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 dark:border-slate-700 dark:bg-slate-900">
      <Text className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</Text>
      <Text className="mt-2 max-w-sm text-center text-sm text-slate-500 dark:text-slate-400">
        {description}
      </Text>
      {action ? <View className="mt-6">{action}</View> : null}
    </View>
  )
}

/**
 * Props for {@link AlertBanner}.
 */
type AlertBannerProps = {
  /**
   * Banner message text.
   */
  message: string
  /**
   * Semantic coloring; defaults to `"info"`.
   */
  variant?: "success" | "error" | "info"
}

const alertStyles = {
  success: "border-emerald-500/30 bg-emerald-500/10",
  error: "border-red-500/30 bg-red-500/10",
  info: "border-emerald-500/30 bg-emerald-500/10",
}

const alertTextStyles = {
  success: "text-emerald-600 dark:text-emerald-400",
  error: "text-red-600 dark:text-red-400",
  info: "text-emerald-600 dark:text-emerald-400",
}

/**
 * Inline status banner for success, error, or informational messages.
 *
 * @param props - Message and optional variant.
 * @returns A bordered alert strip.
 */
export function AlertBanner({
  message,
  variant = "info",
}: AlertBannerProps): React.JSX.Element {
  return (
    <View className={cn("mb-4 rounded-xl border px-4 py-3", alertStyles[variant])}>
      <Text className={cn("text-sm font-medium", alertTextStyles[variant])}>
        {message}
      </Text>
    </View>
  )
}
