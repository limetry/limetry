/**
 * Error classes thrown by `\@limetry/sdk` engines and payment interception paths.
 *
 * All errors extend {@link LimetryError} and carry a stable `code` string for
 * programmatic handling.
 */

/**
 * Base error for Limetry SDK failures.
 *
 * Subclasses set a specific `name` and `code`; callers should catch
 * `LimetryError` (or a subclass) rather than comparing message text.
 */
export class LimetryError extends Error {
  /**
   * Stable machine-readable error code (for example `policy_violation`).
   */
  readonly code: string

  /**
   * Creates a Limetry error with a stable code and human-readable message.
   *
   * @param code - Machine-readable error code.
   * @param message - Human-readable description.
   */
  constructor(code: string, message: string) {
    super(message)
    this.name = "LimetryError"
    this.code = code
  }
}

/**
 * Raised when policy evaluation rejects an intent.
 *
 * The `code` is taken from `violation.code` when it is a string; otherwise
 * `"policy_violation"` is used.
 */
export class PolicyViolationError extends LimetryError {
  /**
   * Structured violation payload returned by the evaluating engine.
   */
  readonly violation: Record<string, unknown>

  /**
   * Creates a policy-violation error from an engine violation object.
   *
   * @param violation - Structured violation payload; `code` is preferred when a string.
   */
  constructor(violation: Record<string, unknown>) {
    const code =
      typeof violation.code === "string" ? violation.code : "policy_violation"
    super(code, `Policy violation: ${code}`)
    this.name = "PolicyViolationError"
    this.violation = violation
  }
}

/**
 * Raised when a client-side velocity circuit breaker blocks a transaction.
 */
export class RateLimitExceededError extends LimetryError {
  /**
   * Configured cooldown window in milliseconds.
   */
  readonly cooldownPeriodMs: number
  /**
   * Elapsed time since the breaker opened, in milliseconds.
   */
  readonly elapsedMs: number

  /**
   * Creates a rate-limit error describing cooldown vs elapsed time.
   *
   * @param cooldownPeriodMs - Full cooldown window in milliseconds.
   * @param elapsedMs - Time already elapsed within the cooldown.
   */
  constructor(cooldownPeriodMs: number, elapsedMs: number) {
    super(
      "rate_limit_exceeded",
      `Transaction blocked by client velocity circuit breaker. Cooldown ${cooldownPeriodMs}ms, elapsed ${elapsedMs}ms`,
    )
    this.name = "RateLimitExceededError"
    this.cooldownPeriodMs = cooldownPeriodMs
    this.elapsedMs = elapsedMs
  }
}

/**
 * Raised when a remote or local policy engine fails to load or respond.
 *
 * Uses the fixed code `engine_load_error`.
 */
export class EngineLoadError extends LimetryError {
  /**
   * Creates an engine-load failure with the given message.
   *
   * @param message - Human-readable load or transport failure description.
   */
  constructor(message: string) {
    super("engine_load_error", message)
    this.name = "EngineLoadError"
  }
}

/**
 * Raised when payment tool interception cannot proceed safely.
 *
 * Uses the fixed code `payment_interception_error`.
 */
export class PaymentInterceptionError extends LimetryError {
  /**
   * Creates a payment-interception failure with the given message.
   *
   * @param message - Human-readable interception failure description.
   */
  constructor(message: string) {
    super("payment_interception_error", message)
    this.name = "PaymentInterceptionError"
  }
}
