/**
 * Replay-window and nonce middleware for `\@limetry/server` mutating requests.
 */

import type { NextFunction, Request, Response } from "express"

import type { ServerEnv } from "../env.js"
import { InMemoryNonceStore, type NonceStore } from "../services/nonce-store.js"

/**
 * Reads a nonce from `x-limetry-nonce` or `body.nonce`.
 *
 * @param request - Incoming Express request.
 * @returns Nonce string, or `null` when absent.
 */
function extractNonce(request: Request): string | null {
  const headerNonce = request.header("x-limetry-nonce")
  if (typeof headerNonce === "string" && headerNonce.length > 0) {
    return headerNonce
  }

  const bodyNonce = (request.body as { nonce?: unknown } | undefined)?.nonce
  if (typeof bodyNonce === "string" && bodyNonce.length > 0) {
    return bodyNonce
  }

  if (typeof bodyNonce === "number" && Number.isFinite(bodyNonce)) {
    return String(bodyNonce)
  }

  return null
}

/**
 * Creates middleware that rejects requests outside `REPLAY_WINDOW_MS` or with
 * a reused nonce.
 *
 * Expects `body.timestamp` as an ISO string and a nonce via header or body.
 *
 * @param env - Server env with `REPLAY_WINDOW_MS`.
 * @param nonceStore - Store used to claim nonces; defaults to in-memory.
 * @returns Async Express middleware.
 */
export function createReplayWindowMiddleware(
  env: ServerEnv,
  nonceStore: NonceStore = new InMemoryNonceStore(),
) {
  return async function replayWindowMiddleware(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    const timestampValue = request.body?.timestamp

    if (typeof timestampValue !== "string") {
      response.status(400).json({
        ok: false,
        error: "Request timestamp is required",
        code: "invalid_timestamp",
      })
      return
    }

    const requestTimestamp = Date.parse(timestampValue)

    if (Number.isNaN(requestTimestamp)) {
      response.status(400).json({
        ok: false,
        error: "Request timestamp is malformed",
        code: "invalid_timestamp",
      })
      return
    }

    const driftMs = Math.abs(Date.now() - requestTimestamp)

    if (driftMs > env.REPLAY_WINDOW_MS) {
      response.status(400).json({
        ok: false,
        error: "Request timestamp is outside the replay protection window",
        code: "replay_window_exceeded",
      })
      return
    }

    const nonce = extractNonce(request)
    if (!nonce) {
      response.status(400).json({
        ok: false,
        error: "Request nonce is required (x-limetry-nonce header or body.nonce)",
        code: "invalid_nonce",
      })
      return
    }

    let claimed: boolean
    try {
      claimed = await nonceStore.claim(nonce, env.REPLAY_WINDOW_MS)
    } catch (err) {
      next(err)
      return
    }

    if (!claimed) {
      response.status(400).json({
        ok: false,
        error: "Request nonce has already been used",
        code: "nonce_replay",
      })
      return
    }

    next()
  }
}
