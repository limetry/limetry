/**
 * Pressable button with variant and size presets for NativeWind surfaces.
 */

import type { ReactNode } from "react"
import { Pressable, type PressableProps,Text } from "react-native"

import { cn } from "../lib/cn"

/**
 * Visual treatment for {@link Button}.
 */
type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "outline"

/**
 * Padding and type scale for {@link Button}.
 */
type ButtonSize = "sm" | "md" | "lg"

/**
 * Props for {@link Button}, extending React Native `PressableProps`.
 */
type ButtonProps = PressableProps & {
  /**
   * Button label string or custom children.
   */
  children: ReactNode
  /**
   * Color / border treatment; defaults to `"primary"`.
   */
  variant?: ButtonVariant
  /**
   * Padding and text size; defaults to `"md"`.
   */
  size?: ButtonSize
  /**
   * Extra classes merged onto the pressable root.
   */
  className?: string
  /**
   * Extra classes merged onto the string-label `Text` child.
   */
  textClassName?: string
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-emerald-500 active:bg-emerald-600 dark:bg-emerald-500 dark:active:bg-emerald-600",
  secondary: "bg-slate-100 active:bg-slate-200 dark:bg-slate-800 dark:active:bg-slate-700",
  ghost: "bg-transparent active:bg-slate-100 dark:active:bg-slate-800",
  destructive: "bg-red-500 active:opacity-90 dark:bg-red-600",
  outline: "bg-transparent border border-slate-300 active:bg-slate-50 dark:border-slate-700 dark:active:bg-slate-800",
}

const textVariantStyles: Record<ButtonVariant, string> = {
  primary: "text-white font-semibold",
  secondary: "text-slate-900 font-medium dark:text-slate-100",
  ghost: "text-slate-900 font-medium dark:text-slate-100",
  destructive: "text-white font-semibold",
  outline: "text-slate-900 font-medium dark:text-slate-100",
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 rounded-lg",
  md: "px-4 py-2.5 rounded-xl",
  lg: "px-6 py-3.5 rounded-xl",
}

const textSizeStyles: Record<ButtonSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
}

/**
 * Accessible pressable button that wraps string children in styled `Text`.
 *
 * @param props - Variant, size, class names, and Pressable props.
 * @returns A `Pressable` root with optional styled label text.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  textClassName,
  disabled,
  ...props
}: ButtonProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        "flex-row items-center justify-center",
        variantStyles[variant],
        sizeStyles[size],
        disabled && "opacity-50",
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {typeof children === "string" ? (
        <Text
          className={cn(
            textVariantStyles[variant],
            textSizeStyles[size],
            textClassName,
          )}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  )
}
