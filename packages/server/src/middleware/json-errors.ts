import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import type { ErrorRequestHandler, RequestHandler, Response } from "express"

/** JSON error body shared by the evaluate API. */
export type ApiErrorBody = {
  error: string
  message?: string
}

function prefersHtml(acceptHeader: string | undefined): boolean {
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

function resolvePublicStatusPage(fileName: "404.html" | "500.html"): string | null {
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

function sendStatusHtml(response: Response, status: 404 | 500, fileName: "404.html" | "500.html"): boolean {
  const filePath = resolvePublicStatusPage(fileName)
  if (!filePath) {
    return false
  }
  response.status(status).type("html").send(readFileSync(filePath, "utf8"))
  return true
}

/**
 * Returns true when the request targets a JSON API route.
 *
 * @param path - Request path without query string.
 * @returns Whether responses should be JSON.
 */
export function isJsonApiPath(path: string): boolean {
  return path === "/health"
    || path === "/metrics"
    || path.startsWith("/v1/")
    || path.startsWith("/openapi")
}

/**
 * Sends a schema-shaped API error response.
 *
 * @param response - Express response.
 * @param status - HTTP status code.
 * @param error - Machine-readable error code.
 * @param message - Optional human-readable detail.
 */
export function sendApiError(
  response: { status: (code: number) => { json: (body: ApiErrorBody) => void } },
  status: number,
  error: string,
  message?: string,
): void {
  response.status(status).json(message ? { error, message } : { error })
}

/**
 * Express error handler that returns JSON for API routes instead of HTML stacks.
 */
export const jsonApiErrorHandler: ErrorRequestHandler = (err, request, response, next) => {
  if (response.headersSent) {
    next(err)
    return
  }

  if (!isJsonApiPath(request.path)) {
    next(err)
    return
  }

  if (err instanceof SyntaxError && "body" in err) {
    sendApiError(response, 400, "invalid_json", "Request body must be valid JSON")
    return
  }

  const errorType = typeof err === "object" && err !== null && "type" in err
    ? String((err as { type?: string }).type)
    : ""
  if (errorType === "entity.too.large") {
    sendApiError(response, 413, "payload_too_large", "Request body exceeds the size limit")
    return
  }

  sendApiError(response, 500, "internal_error")
}

/**
 * Catch-all for unmatched routes (JSON for API clients, branded HTML for browsers).
 */
export const jsonApiNotFoundHandler: RequestHandler = (request, response) => {
  if (isJsonApiPath(request.path) && !prefersHtml(request.headers.accept)) {
    sendApiError(
      response,
      404,
      "not_found",
      "No matching API route. See GET /openapi.json or the landing page at /.",
    )
    return
  }
  if (prefersHtml(request.headers.accept) && sendStatusHtml(response, 404, "404.html")) {
    return
  }
  if (isJsonApiPath(request.path)) {
    sendApiError(response, 404, "not_found")
    return
  }
  response.status(404).type("text/plain").send("Not Found")
}
