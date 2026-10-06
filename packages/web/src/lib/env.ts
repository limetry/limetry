/**
 * Zod-validated public environment for `\@limetry/web`.
 */

import { z } from "zod"

import { CANONICAL_ORIGINS, resolveWebOrigins } from "./public-origins"

/**
 * Zod preprocess helper: treats blank strings as unset.
 *
 * @param value - Raw env value.
 * @returns `undefined` for empty strings; otherwise `value`.
 */
const emptyStringToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value

const envSchema = z.object({
  NEXT_PUBLIC_WEB_URL: z.preprocess(
    emptyStringToUndefined,
    z.string().url().default(CANONICAL_ORIGINS.web),
  ),
  NEXT_PUBLIC_APP_URL: z.preprocess(
    emptyStringToUndefined,
    z.string().url().default(CANONICAL_ORIGINS.app),
  ),
  NEXT_PUBLIC_API_URL: z.preprocess(
    emptyStringToUndefined,
    z.string().url().default(CANONICAL_ORIGINS.ossApi),
  ),
  NEXT_PUBLIC_GITHUB_URL: z.preprocess(
    emptyStringToUndefined,
    z.string().url().default("https://github.com/limetry/limetry"),
  ),
  NEXT_PUBLIC_DISCORD_URL: z.preprocess(
    emptyStringToUndefined,
    z.string().url().default("https://discord.gg/VxUWz7cZP"),
  ),
  NEXT_PUBLIC_CONTACT_FORM_URL: z.preprocess(
    emptyStringToUndefined,
    z.string().url().default("https://app.limetry.com/contact"),
  ),
})

/**
 * Parsed public environment variables for the marketing site.
 */
export type WebEnv = z.infer<typeof envSchema>

/**
 * Returns whether a URL hostname is loopback.
 *
 * @param value - Absolute URL string to inspect.
 * @returns `true` when the host is localhost / 127.0.0.1 / ::1.
 */
export function isLoopbackUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname
    return host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]"
  } catch {
    return false
  }
}

/**
 * Validates and returns web public env, merging resolved origins when unset.
 *
 * @param source - Process env object; defaults to `process.env`.
 * @returns Parsed {@link WebEnv}.
 * @throws When required URL or email fields fail Zod validation.
 */
export function loadWebEnv(source: NodeJS.ProcessEnv = process.env): WebEnv {
  const origins = resolveWebOrigins(source)
  const parsed = envSchema.safeParse({
    ...source,
    NEXT_PUBLIC_WEB_URL: source.NEXT_PUBLIC_WEB_URL || origins.web.url,
    NEXT_PUBLIC_APP_URL: source.NEXT_PUBLIC_APP_URL || origins.app.url,
    NEXT_PUBLIC_API_URL: source.NEXT_PUBLIC_API_URL || origins.api.url,
  })
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ")
    throw new Error(`Invalid web environment: ${details}`)
  }
  return parsed.data
}
