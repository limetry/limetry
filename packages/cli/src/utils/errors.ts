/**
 * CLI error text and cancellation handling.
 *
 * Network failures from `node-fetch` sometimes end with `reason:` and an empty
 * system message. Prompt cancellation throws `ExitPromptError` from the
 * readline SIGINT listener, which otherwise prints a stack trace.
 */

import { logError } from "./config.js"

/** Inquirer errors raised when the user quits a prompt. */
const PROMPT_CANCEL_NAMES = new Set([
  "AbortPromptError",
  "CancelPromptError",
  "ExitPromptError",
])

/** Node system fields copied onto `node-fetch` `FetchError`. */
type SystemErrorFields = {
  code?: unknown
  erroredSysCall?: unknown
}

/**
 * True when the user cancelled a prompt or sent an interrupt.
 *
 * @param error - Caught or uncaught error.
 * @returns Whether the CLI should exit quietly.
 */
export function isUserCancellation(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("name" in error)) {
    return false
  }
  return PROMPT_CANCEL_NAMES.has(String(error.name))
}

/**
 * Builds a non-empty explanation for a failed CLI request.
 *
 * When `node-fetch` reports `reason:` with no message, the system `code`
 * (for example `ECONNREFUSED`) is appended.
 *
 * @param error - Caught request or command error.
 * @returns A single-line reason safe to print.
 */
export function describeCliError(error: unknown): string {
  if (typeof error === "string" && error.trim()) {
    return error.trim()
  }
  if (!(error instanceof Error)) {
    return "Request failed"
  }

  const message = error.message.trim()
  const detail = systemErrorDetail(error)
  if (/reason:\s*$/.test(message)) {
    const reason = detail || "connection failed"
    return message.replace(/reason:\s*$/, `reason: ${reason}`)
  }
  if (!message) {
    return detail || "Request failed"
  }
  return message
}

/**
 * Reads a failure reason from an API response body.
 *
 * Accepts `{ message }`, `{ error }`, plain text, or the HTTP status.
 *
 * @param status - HTTP status code.
 * @param body - Raw response body.
 * @returns A non-empty reason.
 */
export function describeHttpFailure(status: number, body: string): string {
  const trimmed = body.trim()
  if (!trimmed) {
    return `HTTP ${status}`
  }
  try {
    const parsed = JSON.parse(trimmed) as { error?: unknown; message?: unknown }
    const reason = firstText(parsed.message) ?? firstText(parsed.error)
    if (reason) {
      return reason
    }
  } catch {
    return trimmed
  }
  return `HTTP ${status}`
}

/**
 * Prints one line and exits when the user quits, including Ctrl+C.
 *
 * Other uncaught errors print {@link describeCliError} and exit 1.
 * Cancellation exits 130, the conventional SIGINT status.
 *
 * @returns Nothing.
 */
export function installCliErrorHandlers(): void {
  let shuttingDown = false

  const cancel = (): void => {
    if (shuttingDown) {
      return
    }
    shuttingDown = true
    process.stderr.write("\nCancelled.\n")
    process.exit(130)
  }

  process.on("SIGINT", cancel)
  process.on("SIGTERM", cancel)
  process.on("SIGHUP", cancel)
  process.on("uncaughtException", (error: unknown) => {
    if (isUserCancellation(error)) {
      cancel()
      return
    }
    logError(describeCliError(error))
    process.exit(1)
  })
  process.on("unhandledRejection", (error: unknown) => {
    if (isUserCancellation(error)) {
      cancel()
      return
    }
    logError(describeCliError(error))
    process.exit(1)
  })
}

/**
 * Joins syscall and code from a fetch system error.
 *
 * @param error - Error that may carry Node system fields.
 * @returns Detail text, or an empty string.
 */
function systemErrorDetail(error: Error): string {
  const system = error as Error & SystemErrorFields
  const syscall = typeof system.erroredSysCall === "string" ? system.erroredSysCall : ""
  const code = typeof system.code === "string" ? system.code : ""
  return [syscall, code].filter(Boolean).join(" ")
}

/**
 * Returns trimmed text when `value` is a non-empty string.
 *
 * @param value - JSON field that might be a message.
 * @returns Trimmed text, or `null`.
 */
function firstText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }
  const trimmed = value.trim()
  return trimmed || null
}
