/**
 * NativeWind contact form for Expo / React Native hosts.
 */

import { type JSX, useState } from "react"
import { Text, View } from "react-native"

import { Button } from "./button"
import type { ContactFormProps } from "./contact-form.types"
import { Input, TextArea } from "./input"

export type { ContactFormFields, ContactFormProps } from "./contact-form.types"

type SubmitState = "idle" | "submitting" | "success" | "error"

/**
 * Interactive contact form backed by a host-provided submit handler.
 *
 * @param props - Layout options and {@link ContactFormProps.onSubmit}.
 */
export function ContactForm({
  className,
  source = "contact-page",
  compact = false,
  onSubmit,
}: ContactFormProps): JSX.Element {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [message, setMessage] = useState("")
  const [state, setState] = useState<SubmitState>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(): Promise<void> {
    setState("submitting")
    setErrorMessage(null)
    try {
      await onSubmit({
        name,
        email,
        company: company.trim() || undefined,
        message,
        source,
      })
      setName("")
      setEmail("")
      setCompany("")
      setMessage("")
      setState("success")
    } catch (error) {
      setState("error")
      setErrorMessage(
        error instanceof Error ? error.message : "Could not send your message",
      )
    }
  }

  if (state === "success") {
    return (
      <View className={className} accessibilityRole="text">
        <Text className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
          Message sent. We will get back to you soon.
        </Text>
      </View>
    )
  }

  return (
    <View className={className}>
      <View className={compact ? "gap-4 md:flex-row md:flex-wrap" : "gap-4"}>
        <View className={compact ? "md:w-[calc(50%-0.5rem)]" : undefined}>
          <Input
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            autoComplete="off"
          />
        </View>
        <View className={compact ? "md:w-[calc(50%-0.5rem)]" : undefined}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="off"
          />
        </View>
        {!compact ? (
          <Input
            label="Company (optional)"
            value={company}
            onChangeText={setCompany}
            placeholder="Organization"
            autoComplete="off"
          />
        ) : null}
        <TextArea
          label="Message"
          value={message}
          onChangeText={setMessage}
          placeholder={
            compact ? "How can we help?" : "Tell us about your agents or workspace."
          }
          rows={compact ? 3 : 5}
        />
        {errorMessage ? (
          <Text
            className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400"
            accessibilityRole="alert"
          >
            {errorMessage}
          </Text>
        ) : null}
        <View className="w-full items-start">
          <Button
            size="lg"
            disabled={state === "submitting"}
            onPress={() => {
              void handleSubmit()
            }}
          >
            {state === "submitting" ? "Sending…" : "Send message"}
          </Button>
        </View>
      </View>
    </View>
  )
}
