/**
 * Lightweight in-process IP rate limit for public contact endpoints.
 *
 * Complements Turnstile: tokens are single-use, but direct API abuse and
 * token-farming still need a cheap ceiling before Brevo/Resend.
 *
 * Lambda instances are ephemeral — this is best-effort per isolate, not a
 * global Redis throttle. Prefer Redis later if abuse volume requires it.
 */

type Bucket = {
  timestamps: number[]
}

const buckets = new Map<string, Bucket>()

export type ContactRateLimitOptions = {
  /** Max requests per window (default 5). */
  max?: number
  /** Window length in ms (default 60_000). */
  windowMs?: number
  /** Key — usually client IP. */
  key: string
}

/**
 * Returns whether the key is allowed and records the attempt when allowed.
 */
export function consumeContactRateLimit(
  options: ContactRateLimitOptions,
): { allowed: true } | { allowed: false, retryAfterSec: number } {
  const max = options.max ?? 5
  const windowMs = options.windowMs ?? 60_000
  const now = Date.now()
  const key = options.key.trim() || "unknown"
  let bucket = buckets.get(key)
  if (!bucket) {
    bucket = { timestamps: [] }
    buckets.set(key, bucket)
  }
  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < windowMs)
  if (bucket.timestamps.length >= max) {
    const oldest = bucket.timestamps[0] ?? now
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000))
    return { allowed: false, retryAfterSec }
  }
  bucket.timestamps.push(now)
  return { allowed: true }
}

/**
 * Best-effort client IP from common proxy headers.
 */
export function clientIpFromHeaders(
  headers: Record<string, string | string[] | undefined>,
): string {
  const cf = headers["cloudfront-viewer-address"]
  if (typeof cf === "string" && cf.length > 0) {
    // e.g. "1.2.3.4:12345"
    return cf.split(":")[0] || cf
  }
  const forwarded = headers["x-forwarded-for"]
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() || "unknown"
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(",")[0]?.trim() || "unknown"
  }
  const realIp = headers["x-real-ip"]
  if (typeof realIp === "string" && realIp.length > 0) {
    return realIp
  }
  return "unknown"
}
