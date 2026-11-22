/**
 * Resolves a Turnstile sitekey from env, then optional `/turnstile.json`.
 */

export type TurnstileConfigFile = {
  siteKey?: string
  action?: string
}

/**
 * Fetches `/turnstile.json` when the build-time sitekey is empty (first deploy).
 */
export async function loadTurnstileSiteKey(
  bakedSiteKey: string | undefined,
): Promise<string> {
  const baked = (bakedSiteKey || "").trim()
  if (baked) {
    return baked
  }
  if (typeof window === "undefined") {
    return ""
  }
  try {
    const response = await fetch("/turnstile.json", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    })
    if (!response.ok) {
      return ""
    }
    const payload = (await response.json()) as TurnstileConfigFile
    return typeof payload.siteKey === "string" ? payload.siteKey.trim() : ""
  } catch {
    return ""
  }
}
