/**
 * Structured logging, request correlation, in-process metrics, and optional
 * OpenTelemetry spans for `\@limetry/server`.
 */

import { randomUUID } from "node:crypto"

import type { NextFunction, Request, Response } from "express"
import pino from "pino"

/**
 * Process-wide Pino logger named `limetry-server`.
 */
export const logger = pino({
  name: "limetry-server",
  level: process.env.LOG_LEVEL ?? "info",
})

/**
 * Express request augmented with correlation id and child logger.
 */
export type RequestWithId = Request & {
  /**
   * Correlation id from `x-request-id` or a generated UUID.
   */
  requestId?: string
  /**
   * Request-scoped Pino child logger.
   */
  log?: pino.Logger
}

/**
 * Creates middleware that assigns `x-request-id`, a child logger, and logs
 * completion with status and duration.
 *
 * @returns Express middleware.
 */
export function createRequestContextMiddleware() {
  return function requestContextMiddleware(
    request: Request,
    response: Response,
    next: NextFunction,
  ): void {
    const incoming = request.header("x-request-id")
    const requestId = incoming && incoming.length > 0 ? incoming : randomUUID()
    const req = request as RequestWithId
    req.requestId = requestId
    req.log = logger.child({ requestId, method: request.method, path: request.path })
    response.setHeader("x-request-id", requestId)

    const started = Date.now()
    response.on("finish", () => {
      req.log?.info({
        statusCode: response.statusCode,
        durationMs: Date.now() - started,
      }, "request.completed")
    })

    next()
  }
}

/**
 * Point-in-time counters exposed by `GET /metrics`.
 */
export type MetricsSnapshot = {
  /**
   * Total requests observed by the request counter middleware.
   */
  requestsTotal: number
  /**
   * Total errors recorded via {@link MetricsRegistry.incrementErrors}.
   */
  errorsTotal: number
}

/**
 * Process-local metrics registry (not shared across Lambda/instances).
 */
export class MetricsRegistry {
  private requestsTotal = 0
  private errorsTotal = 0

  /**
   * Increments the request counter by one.
   *
   * @returns Nothing.
   */
  incrementRequests(): void {
    this.requestsTotal += 1
  }

  /**
   * Increments the error counter by one.
   *
   * @returns Nothing.
   */
  incrementErrors(): void {
    this.errorsTotal += 1
  }

  /**
   * Returns a copy of current counters.
   *
   * @returns Snapshot of request and error totals.
   */
  snapshot(): MetricsSnapshot {
    return {
      requestsTotal: this.requestsTotal,
      errorsTotal: this.errorsTotal,
    }
  }
}

/**
 * Shared metrics registry for the current process.
 */
export const metrics = new MetricsRegistry()

/**
 * Lightweight OpenTelemetry-compatible span helper.
 * When `\@opentelemetry/api` is available it creates a span; otherwise no-ops.
 *
 * @typeParam T - Return type of the wrapped function.
 * @param name - Span name.
 * @param fn - Synchronous or async work to wrap.
 * @returns Result of `fn`.
 * @throws Rethrows any error from `fn` after recording it on the span when OTel is present.
 */
export async function withSpan<T>(
  name: string,
  fn: () => Promise<T> | T,
): Promise<T> {
  try {
    const otel = await import("@opentelemetry/api")
    const tracer = otel.trace.getTracer("limetry-server")
    return tracer.startActiveSpan(name, async (span) => {
      try {
        return await fn()
      } catch (error) {
        span.recordException(error as Error)
        span.setStatus({ code: otel.SpanStatusCode.ERROR })
        throw error
      } finally {
        span.end()
      }
    })
  } catch {
    return fn()
  }
}
