"use client"

/**
 * Shared DOM contact form for Limetry marketing sites (OSS + Cloud).
 */

import { type FormEvent, type JSX, useEffect, useState } from "react"

import { cn } from "../lib/cn"
import { loadTurnstileSiteKey } from "../lib/turnstile-sitekey"
import type { ContactFormProps } from "./contact-form.types"
import { TurnstileInvisibleMount, useInvisibleTurnstile } from "./turnstile.web"

export type { ContactFormFields, ContactFormProps } from "./contact-form.types"

type SubmitState = "idle" | "submitting" | "success" | "error"

const fieldClassName = cn(
  "rounded-xl border-border bg-background px-4 py-3 text-sm w-full border",
  "text-foreground shadow-sm transition outline-none",
  "placeholder:text-muted-foreground",
  "focus-visible:border-primary/50 focus-visible:ring-primary/25 focus-visible:ring-2",
)

/**
 * Client contact form with validation, success state, and host-backed submit.
 *
 * @param props - Layout options and {@link ContactFormProps.onSubmit}.
 * @returns Interactive contact form.
 */
export function ContactForm({
  className,
  idPrefix = "contact",
  source = "contact-page",
  compact = false,
  turnstileSiteKey,
  turnstileAction = "contact",
  onSubmit,
}: ContactFormProps): JSX.Element {
  const [state, setState] = useState<SubmitState>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [resolvedSiteKey, setResolvedSiteKey] = useState(turnstileSiteKey || "")
  const turnstile = useInvisibleTurnstile({
    siteKey: resolvedSiteKey,
    action: turnstileAction,
  })

  useEffect(() => {
    let cancelled = false
    void loadTurnstileSiteKey(turnstileSiteKey).then((key) => {
      if (!cancelled && key) {
        setResolvedSiteKey(key)
      }
    })
    return () => {
      cancelled = true
    }
  }, [turnstileSiteKey])

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setState("submitting")
    setErrorMessage(null)

    const form = event.currentTarget
    const data = new FormData(form)

    try {
      const siteKey = resolvedSiteKey || await loadTurnstileSiteKey(turnstileSiteKey)
      if (!siteKey) {
        throw new Error("Security check is unavailable — try again shortly")
      }
      if (siteKey !== resolvedSiteKey) {
        setResolvedSiteKey(siteKey)
      }
      const turnstileToken = await turnstile.getToken(siteKey)
      await onSubmit({
        name: String(data.get("name") ?? ""),
        email: String(data.get("email") ?? ""),
        company: String(data.get("company") ?? "") || undefined,
        message: String(data.get("message") ?? ""),
        source,
        turnstileToken,
      })
      form.reset()
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
      <div className={className} role="status" aria-live="polite">
        <p className="
          rounded-xl border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium
          text-foreground border
        ">
          Message sent. We&apos;ll get back to you soon.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event)
      }}
      className={cn("relative", className)}
      autoComplete="off"
      data-1p-ignore
      data-lpignore="true"
      data-bwignore
      data-form-type="other"
    >
      {resolvedSiteKey ? <TurnstileInvisibleMount containerRef={turnstile.containerRef} /> : null}
      <div className={compact ? "gap-4 sm:grid-cols-2 grid" : "space-y-5"}>
        <div className="space-y-2">
          <label
            htmlFor={`${idPrefix}-name`}
            className="text-sm font-medium text-foreground"
          >
            Name
          </label>
          <input
            id={`${idPrefix}-name`}
            name="name"
            type="text"
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            required
            minLength={2}
            maxLength={120}
            className={fieldClassName}
            placeholder="Your name"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor={`${idPrefix}-email`}
            className="text-sm font-medium text-foreground"
          >
            Email
          </label>
          <input
            id={`${idPrefix}-email`}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            required
            maxLength={254}
            className={fieldClassName}
            placeholder="you@company.com"
          />
        </div>
        {!compact ? (
          <div className="space-y-2">
            <label
              htmlFor={`${idPrefix}-company`}
              className="text-sm font-medium text-foreground"
            >
              Company
              <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id={`${idPrefix}-company`}
              name="company"
              type="text"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              maxLength={160}
              className={fieldClassName}
              placeholder="Organization"
            />
          </div>
        ) : null}
        <div className={`space-y-2 ${compact ? "sm:col-span-2" : ""}`}>
          <label
            htmlFor={`${idPrefix}-message`}
            className="text-sm font-medium text-foreground"
          >
            Message
          </label>
          <textarea
            id={`${idPrefix}-message`}
            name="message"
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            required
            minLength={10}
            maxLength={5_000}
            rows={compact ? 3 : 5}
            className={cn(fieldClassName, "resize-y")}
            placeholder={
              compact
                ? "How can we help?"
                : "Tell us about your agents, policies, or a partnership idea."
            }
          />
        </div>
        {errorMessage ? (
          <p
            className={cn(
              `
                rounded-lg border-red-500/25 bg-red-500/10 px-3 py-2 text-sm font-medium
                text-red-600
                dark:text-red-400
                border
              `,
              compact && "sm:col-span-2",
            )}
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}
        <div className={compact ? "sm:col-span-2" : ""}>
          <button
            type="submit"
            disabled={state === "submitting"}
            className={cn(
              "rounded-xl inline-flex w-full items-center justify-center whitespace-nowrap",
              "bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground",
              "shadow-lg shadow-primary/25 transition-all",
              "hover:-translate-y-0.5 hover:bg-primary/90",
              "disabled:pointer-events-none disabled:opacity-60",
              "sm:w-auto",
            )}
          >
            {state === "submitting" ? "Sending…" : "Send message"}
          </button>
        </div>
      </div>
    </form>
  )
}
