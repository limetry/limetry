/**
 * Client-safe Turnstile sitekey resolution (no Node-only deps).
 */

import {
  TURNSTILE_TEST_SITEKEY_INVISIBLE,
} from "../turnstile/keys.js"

/**
 * Resolves the public sitekey for contact embeds.
 *
 * Falls back to Cloudflare's always-pass invisible test key outside production
 * so localhost works without a Pulumi-provisioned widget.
 */
export function resolveTurnstileSiteKey(
  env: {
    NEXT_PUBLIC_TURNSTILE_SITE_KEY?: string
    EXPO_PUBLIC_TURNSTILE_SITE_KEY?: string
    NODE_ENV?: string
  } = typeof process !== "undefined" ? process.env : {},
): string {
  const configured = (
    env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    || env.EXPO_PUBLIC_TURNSTILE_SITE_KEY
    || ""
  ).trim()
  if (configured) {
    return configured
  }
  if (env.NODE_ENV === "production") {
    return ""
  }
  return TURNSTILE_TEST_SITEKEY_INVISIBLE
}

export {
  TURNSTILE_DUMMY_TOKEN,
  TURNSTILE_TEST_SECRET_PASS,
  TURNSTILE_TEST_SITEKEY_INVISIBLE,
} from "../turnstile/keys.js"
