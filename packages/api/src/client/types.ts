/**
 * Shared result shape for client-side email / contact adapters.
 */

/**
 * Outcome of a client-side provider submit.
 */
export type EmailProviderResult = {
  ok: boolean
  error?: string
  detail?: string
}

/**
 * Normalizes CMS / env provider ids to lowercase keys.
 *
 * @param value - Raw provider id.
 * @returns Lowercased trimmed id.
 */
export function normalizeProviderId(value: string | undefined | null): string {
  return String(value ?? "").trim().toLowerCase()
}
