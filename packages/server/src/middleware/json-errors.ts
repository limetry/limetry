import type { ErrorRequestHandler, RequestHandler } from "express"

/** JSON error body shared by the evaluate API. */
export type ApiErrorBody = {
  error: string
  message?: string
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
 * Catch-all for unmatched JSON API routes.
 */
export const jsonApiNotFoundHandler: RequestHandler = (request, response) => {
  if (isJsonApiPath(request.path)) {
    sendApiError(response, 404, "not_found")
    return
  }
  response.status(404).type("text/plain").send("Not Found")
}
