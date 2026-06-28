/**
 * Bordered content card and title/description header for dashboard layouts.
 */

import type { ReactNode } from "react"
import { Text, View, type ViewProps } from "react-native"

import { cn } from "../lib/cn"

/**
 * Props for {@link Card}.
 */
type CardProps = ViewProps & {
  /**
   * Card body content.
   */
  children: ReactNode
  /**
   * Extra classes merged onto the card surface.
   */
  className?: string
}

/**
 * Elevated surface container with border and padding.
 *
 * @param props - Children, className, and View props.
 * @returns A styled card `View`.
 */
export function Card({ children, className, ...props }: CardProps): React.JSX.Element {
  return (
    <View
      className={cn(
        "rounded-2xl min-h-[88px] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900",
        className,
      )}
      {...props}
    >
      {children}
    </View>
  )
}

/**
 * Props for {@link CardHeader}.
 */
type CardHeaderProps = {
  /**
   * Primary card title.
   */
  title: string
  /**
   * Optional supporting description under the title.
   */
  description?: string
  /**
   * Optional action slot aligned to the trailing edge.
   */
  action?: ReactNode
  /**
   * Extra classes on the header row.
   */
  className?: string
}

/**
 * Title row for use inside {@link Card}, with optional description and action.
 *
 * @param props - Title, description, action, and className.
 * @returns A header row suitable for card tops.
 */
export function CardHeader({
  title,
  description,
  action,
  className,
}: CardHeaderProps): React.JSX.Element {
  return (
    <View className={cn("mb-4 flex-row items-start justify-between", className)}>
      <View className="flex-1 pr-3">
        <Text className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</Text>
        {description ? (
          <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</Text>
        ) : null}
      </View>
      {action}
    </View>
  )
}
