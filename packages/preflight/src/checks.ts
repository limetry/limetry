/**
 * Helpers that build and format individual preflight banner check rows.
 */

import { maskSecret } from "./mask.js"
import type { PreflightCheck, PreflightCheckKind } from "./types.js"

/**
 * Builds a {@link PreflightCheck} for an environment variable or secret.
 *
 * Pass `value` for masking/display; use `display` to override the shown text
 * (e.g. same-origin proxy labels). Prefer values from a typed product env
 * object rather than ambient `process.env` at the adapter layer.
 *
 * @param input - Check fields and optional display/masking overrides.
 * @returns A fully formed {@link PreflightCheck} ready for `runPreflight`.
 */
export function envCheck(input: {
  critical?: boolean
  display?: string
  kind?: PreflightCheckKind
  name: string
  ok: boolean
  required: boolean
  secret?: boolean
  value?: string
}): PreflightCheck {
  const kind = input.kind ?? (input.secret ? "secret" : "env")
  const detail = input.display
    ?? (input.secret ? maskSecret(input.value) : (input.value || "(unset)"))
  return {
    name: input.name,
    ok: input.ok,
    required: input.required,
    critical: input.critical,
    detail,
    kind,
  }
}

/**
 * Banner icon for a check: pass, optional warn, required-degraded warn, or fail.
 *
 * @param check - Severity fields from a {@link PreflightCheck}.
 * @returns Emoji status glyph for the banner line.
 */
export function connectivityIcon(
  check: Pick<PreflightCheck, "critical" | "ok" | "required">,
): string {
  if (check.ok) {
    return "✅"
  }
  if (!check.required) {
    return "⚠️"
  }
  return check.critical === false ? "⚠️" : "❌"
}

/**
 * Formats an env/secret check line for the banner.
 *
 * @param check - Env or secret {@link PreflightCheck} to render.
 * @returns A single banner line: icon, name, and detail.
 */
export function formatCheckLine(check: PreflightCheck): string {
  return `${connectivityIcon(check)} ${check.name}: ${check.detail}`
}

/**
 * Formats a connectivity check line (detail only; name is probe-internal).
 *
 * @param check - Connectivity {@link PreflightCheck} to render.
 * @returns A single banner line: icon and detail.
 */
export function formatConnectivityLine(check: PreflightCheck): string {
  return `${connectivityIcon(check)} ${check.detail}`
}
