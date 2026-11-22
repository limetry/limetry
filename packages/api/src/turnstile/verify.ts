/**
 * Canonical Cloudflare Turnstile siteverify for contact (and similar) handlers.
 */

import { TURNSTILE_TEST_SECRET_PASS } from "./keys.js"

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
const MAX_TOKEN_LENGTH = 2048

export type TurnstileVerifyInput = {
  token: unknown
  secret: string
  /** Expected `action` stamped by the client widget (e.g. `contact`). */
  expectedAction: string
  /**
   * Hostnames allowed in the siteverify response.
   * Skipped when using Cloudflare test secrets (hostname is always `example.com`).
   */
  expectedHostnames: ReadonlySet<string>
  /** Optional client IP forwarded to siteverify. */
  remoteIp?: string
}

export type TurnstileVerifyResult =
  | { ok: true }
  | { ok: false, error: string, status: 400 | 403 | 502 }

type SiteverifyResponse = {
  success?: boolean
  action?: string
  hostname?: string
  "error-codes"?: string[]
}

/**
 * True when the secret is a Cloudflare always-pass test key.
 */
export function isTurnstileTestSecret(secret: string): boolean {
  return secret === TURNSTILE_TEST_SECRET_PASS
}

/**
 * Resolves the server secret: env override, else test secret outside production.
 *
 * @param env - Process env bag.
 * @returns Secret string (may be empty in production when unset).
 */
export function resolveTurnstileSecret(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const configured = (env.TURNSTILE_SECRET_KEY || env.TURNSTILE_SECRET || "").trim()
  if (configured) {
    return configured
  }
  if (env.NODE_ENV === "production" || env.LIMETRY_STATIC_EXPORT === "1") {
    // Production artifacts must bake a real secret; empty means fail-closed.
    return ""
  }
  return TURNSTILE_TEST_SECRET_PASS
}

/**
 * Parses a comma-separated hostname allowlist from env.
 */
export function parseTurnstileHostnames(
  raw: string | undefined,
): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((hostname) => hostname.trim().toLowerCase())
      .filter(Boolean),
  )
}

/**
 * Verifies a Turnstile token via Cloudflare siteverify (fail closed).
 */
export async function verifyTurnstileToken(
  input: TurnstileVerifyInput,
): Promise<TurnstileVerifyResult> {
  if (!input.secret) {
    return { ok: false, error: "Turnstile is not configured", status: 403 }
  }

  if (typeof input.token !== "string" || input.token.length === 0) {
    return { ok: false, error: "Turnstile token is required", status: 400 }
  }
  if (input.token.length > MAX_TOKEN_LENGTH) {
    return { ok: false, error: "Turnstile token is invalid", status: 400 }
  }

  const body = new URLSearchParams({
    secret: input.secret,
    response: input.token,
  })
  if (input.remoteIp) {
    body.set("remoteip", input.remoteIp)
  }

  let result: SiteverifyResponse
  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) {
      return { ok: false, error: "Turnstile verification unavailable", status: 502 }
    }
    result = (await response.json()) as SiteverifyResponse
  } catch {
    return { ok: false, error: "Turnstile verification unavailable", status: 502 }
  }

  if (!result.success) {
    const codes = result["error-codes"]?.join(", ") || "failed"
    return { ok: false, error: `Turnstile verification failed (${codes})`, status: 403 }
  }

  if (result.action !== input.expectedAction) {
    return { ok: false, error: "Turnstile action mismatch", status: 403 }
  }

  // Test secrets always report hostname `example.com` — skip allowlist there.
  if (!isTurnstileTestSecret(input.secret)) {
    const hostname = (result.hostname || "").toLowerCase()
    if (input.expectedHostnames.size === 0) {
      return { ok: false, error: "Turnstile hostnames are not configured", status: 403 }
    }
    if (!input.expectedHostnames.has(hostname)) {
      return { ok: false, error: "Turnstile hostname mismatch", status: 403 }
    }
  }

  return { ok: true }
}
