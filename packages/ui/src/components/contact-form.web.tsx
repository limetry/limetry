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
  // Explicit slate fills so Expo web dark mode is not stuck on baked `bg-background`.
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm",
  "text-slate-900 transition-[border-color,box-shadow] duration-150 outline-none",
  "placeholder:text-slate-400",
  "dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500",
  "focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/25",
  "dark:focus-visible:border-emerald-400 dark:focus-visible:ring-emerald-400/25",
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
          rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium
          text-slate-900
          dark:text-slate-100
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
      <div className={compact ? "grid gap-4 sm:grid-cols-2" : "space-y-5"}>
        <div className="space-y-2">
          <label
            htmlFor={`${idPrefix}-name`}
            className="text-sm font-medium text-slate-900 dark:text-slate-100"
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
            className="text-sm font-medium text-slate-900 dark:text-slate-100"
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
              className="text-sm font-medium text-slate-900 dark:text-slate-100"
            >
              Company
              <span className="ml-1 font-normal text-slate-500 dark:text-slate-400">(optional)</span>
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
            className="text-sm font-medium text-slate-900 dark:text-slate-100"
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
                rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm font-medium
                text-red-600
                dark:text-red-400
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
              "inline-flex w-full items-center justify-center rounded-xl whitespace-nowrap",
              "bg-emerald-600 px-6 py-3 text-sm font-semibold text-white",
              "shadow-lg shadow-emerald-600/25 transition-all",
              "hover:-translate-y-0.5 hover:bg-emerald-500",
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
