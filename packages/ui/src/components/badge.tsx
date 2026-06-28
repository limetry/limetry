/**
 * Compact status pill for labels such as success, warning, and error.
 */

import { Text, View } from "react-native"

import { cn } from "../lib/cn"

/**
 * Color treatment for {@link Badge}.
 */
type BadgeVariant = "default" | "success" | "warning" | "error" | "outline"

/**
 * Props for {@link Badge}.
 */
type BadgeProps = {
  /**
   * Badge label text.
   */
  children: string
  /**
   * Visual variant; defaults to `"default"`.
   */
  variant?: BadgeVariant
  /**
   * Extra classes on the badge container.
   */
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-100 dark:bg-slate-800",
  success: "bg-emerald-500/15 dark:bg-emerald-500/20",
  warning: "bg-amber-500/15 dark:bg-amber-500/20",
  error: "bg-red-500/15 dark:bg-red-500/20",
  outline: "bg-transparent border border-slate-200 dark:border-slate-700",
}

const textVariantStyles: Record<BadgeVariant, string> = {
  default: "text-slate-600 dark:text-slate-300",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  error: "text-red-600 dark:text-red-400",
  outline: "text-slate-900 dark:text-slate-100",
}

/**
 * Self-start rounded label chip.
 *
 * @param props - Label text, variant, and className.
 * @returns A styled badge `View`.
 */
export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps): React.JSX.Element {
  return (
    <View className={cn("self-start rounded-full px-2.5 py-1", variantStyles[variant], className)}>
      <Text className={cn("text-xs font-medium", textVariantStyles[variant])}>
        {children}
      </Text>
    </View>
  )
}
