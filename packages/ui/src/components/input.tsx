/**
 * Labeled text fields and form section headings for NativeWind forms.
 */

import type { ReactNode } from "react"
import { Text, TextInput, type TextInputProps,View } from "react-native"

import { cn } from "../lib/cn"

/**
 * Props for {@link Input}, extending React Native `TextInputProps`.
 */
type InputProps = TextInputProps & {
  /**
   * Optional field label rendered above the control.
   */
  label?: string
  /**
   * Helper text shown when `error` is absent.
   */
  hint?: string
  /**
   * Validation message; when set, overrides `hint` and styles the border red.
   */
  error?: string
  /**
   * Extra classes on the outer field wrapper.
   */
  containerClassName?: string
  /**
   * Extra classes on the `TextInput`.
   */
  className?: string
}

/**
 * Single-line (or host-controlled) text input with label, hint, and error.
 *
 * @param props - Label/hint/error, container classes, and TextInput props.
 * @returns A labeled field column.
 */
export function Input({
  label,
  hint,
  error,
  containerClassName,
  className,
  editable = true,
  ...props
}: InputProps): React.JSX.Element {
  return (
    <View className={cn("mb-4", containerClassName)}>
      {label ? (
        <Text className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">{label}</Text>
      ) : null}
      <TextInput
        className={cn(
          "rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100",
          !editable && "opacity-60",
          error && "border-red-500 dark:border-red-500",
          className,
        )}
        editable={editable}
        placeholderTextColor="#94a3b8"
        {...props}
      />
      {error ? (
        <Text className="mt-1.5 text-xs text-red-500 dark:text-red-400">{error}</Text>
      ) : hint ? (
        <Text className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</Text>
      ) : null}
    </View>
  )
}

/**
 * Props for {@link TextArea}.
 */
type TextAreaProps = InputProps & {
  /**
   * Approximate visible line count (`numberOfLines`); defaults to `4`.
   */
  rows?: number
}

/**
 * Multiline text field built on {@link Input} with mono-friendly styling.
 *
 * @param props - Input props plus optional `rows`.
 * @returns A multiline labeled field.
 */
export function TextArea({
  label,
  hint,
  error,
  containerClassName,
  className,
  rows = 4,
  ...props
}: TextAreaProps): React.JSX.Element {
  return (
    <Input
      containerClassName={containerClassName}
      error={error}
      hint={hint}
      label={label}
      multiline
      numberOfLines={rows}
      className={cn("min-h-[100px] py-3 font-mono text-sm", className)}
      textAlignVertical="top"
      {...props}
    />
  )
}

/**
 * Props for {@link FormSection}.
 */
type FormSectionProps = {
  /**
   * Section heading above the child fields.
   */
  title: string
  /**
   * Field controls rendered under the title.
   */
  children: ReactNode
}

/**
 * Groups related form controls under a section title.
 *
 * @param props - Title and child fields.
 * @returns A titled form block.
 */
export function FormSection({ title, children }: FormSectionProps): React.JSX.Element {
  return (
    <View className="mb-6">
      <Text className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</Text>
      {children}
    </View>
  )
}
