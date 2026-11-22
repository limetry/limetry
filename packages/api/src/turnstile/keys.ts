/**
 * Cloudflare Turnstile test keys (always-pass invisible) for local/dev.
 *
 * @see https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 */

/** Invisible widget sitekey that always passes (any hostname). */
export const TURNSTILE_TEST_SITEKEY_INVISIBLE = "1x00000000000000000000BB"

/** Secret that always accepts the dummy token. */
export const TURNSTILE_TEST_SECRET_PASS = "1x0000000000000000000000000000000AA"

/** Dummy token minted by test sitekeys. */
export const TURNSTILE_DUMMY_TOKEN = "XXXX.DUMMY.TOKEN.XXXX"
