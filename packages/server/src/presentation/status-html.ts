/**
 * Browser-facing status page helpers for the evaluate API landing host.
 *
 * Kept under `presentation/` so versionGate ignores UI chrome churn.
 */

import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import type { Response } from "express"

/**
 * Whether the client prefers HTML over JSON based on Accept.
 *
 * @param acceptHeader - Raw Accept header.
 * @returns True when HTML should be served.
 */
export function prefersHtml(acceptHeader: string | undefined): boolean {
  if (!acceptHeader) {
    return false
  }
  const accept = acceptHeader.toLowerCase()
  const html = accept.indexOf("text/html")
  if (html < 0) {
    return false
  }
  const json = accept.indexOf("application/json")
  if (json < 0) {
    return true
  }
  return html < json
}

/**
 * Resolves a packaged public status HTML file.
 *
 * @param fileName - `404.html` or `500.html`.
 * @returns Absolute path when found.
 */
export function resolvePublicStatusPage(
  fileName: "404.html" | "500.html",
): string | null {
  const candidates = [
    join(process.cwd(), "public", fileName),
    join(dirname(fileURLToPath(import.meta.url)), "../../public", fileName),
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }
  return null
}

/**
 * Sends a branded status HTML document when the file exists.
 *
 * @param response - Express response.
 * @param status - HTTP status.
 * @param fileName - Status page filename.
 * @returns True when HTML was sent.
 */
export function sendStatusHtml(
  response: Response,
  status: 404 | 500,
  fileName: "404.html" | "500.html",
): boolean {
  const filePath = resolvePublicStatusPage(fileName)
  if (!filePath) {
    return false
  }
  response.status(status).type("html").send(readFileSync(filePath, "utf8"))
  return true
}
