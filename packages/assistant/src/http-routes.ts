/**
 * Ask Limetry HTTP routes (`POST /api/chat`, `POST /api/chat/stream`).
 */

import type { Express, NextFunction, Request, Response } from "express"
import { z } from "zod"

import { prepareAssistantChatStream, runAssistantChat } from "./chat.js"
import type { AssistantEnv } from "./env.js"

const chatBodySchema = z.object({
  message: z.string().min(1).max(4_000),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(8_000),
  })).max(20).optional(),
})

/**
 * Adds the `www.` / apex sibling for a marketing origin.
 *
 * @param origin - Absolute origin without a trailing slash.
 * @returns Origin plus its www/apex twin when applicable.
 */
export function chatCorsOriginVariants(origin: string): string[] {
  const trimmed = origin.replace(/\/$/, "")
  try {
    const url = new URL(trimmed)
    const host = url.hostname
    const variants = new Set<string>([url.origin])
    if (host.startsWith("www.")) {
      url.hostname = host.slice(4)
      variants.add(url.origin)
    } else if (host.includes(".")) {
      url.hostname = `www.${host}`
      variants.add(url.origin)
    }
    return [...variants]
  } catch {
    return [trimmed]
  }
}

/**
 * Builds allowed browser origins for Ask Limetry.
 *
 * @param env - Assistant env.
 * @returns Origin strings that may call `/api/chat` from the browser.
 */
function chatCorsOrigins(env: AssistantEnv): string[] {
  const origins = new Set<string>([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3800",
    "http://127.0.0.1:3800",
  ])
  const extra = env.LIMETRY_ASSISTANT_CORS_ORIGINS
  if (extra) {
    for (const origin of extra.split(",")) {
      const trimmed = origin.trim().replace(/\/$/, "")
      if (trimmed) {
        for (const variant of chatCorsOriginVariants(trimmed)) {
          origins.add(variant)
        }
      }
    }
  }
  return [...origins]
}

/**
 * Applies CORS headers for browser Ask Limetry requests.
 *
 * @param request - Incoming request.
 * @param response - Outgoing response.
 * @param env - Assistant env.
 * @returns Whether the request Origin was allowed (or absent).
 */
function applyChatCors(
  request: Request,
  response: Response,
  env: AssistantEnv,
): boolean {
  const origin = request.headers.origin
  if (!origin) {
    return true
  }
  const allowed = chatCorsOrigins(env)
  if (!allowed.includes(origin)) {
    return false
  }
  response.setHeader("Access-Control-Allow-Origin", origin)
  response.setHeader("Vary", "Origin")
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept",
  )
  response.setHeader("Access-Control-Max-Age", "86400")
  return true
}

/**
 * Writes one SSE data event.
 *
 * @param response - Express response.
 * @param payload - JSON-serializable event body.
 */
function writeSse(response: Response, payload: unknown): void {
  response.write(`data: ${JSON.stringify(payload)}\n\n`)
}

/**
 * Registers Ask Limetry chat endpoints on an Express app.
 *
 * Paths are same-origin on limetry.org: `/api/chat` and `/api/chat/stream`.
 *
 * @param app - Express app.
 * @param env - Validated assistant env.
 */
export function createChatRoutes(app: Express, env: AssistantEnv): void {
  const corsGate = (
    request: Request,
    response: Response,
    next: NextFunction,
  ): void => {
    if (!applyChatCors(request, response, env)) {
      response.status(403).json({ error: "cors_origin_denied" })
      return
    }
    next()
  }

  for (const path of ["/api/chat", "/api/chat/stream"] as const) {
    app.options(path, (request, response) => {
      if (!applyChatCors(request, response, env)) {
        response.status(403).end()
        return
      }
      response.status(204).end()
    })
  }

  app.post(
    "/api/chat",
    corsGate,
    async (request: Request, response: Response): Promise<void> => {
      const parsed = chatBodySchema.safeParse(request.body)
      if (!parsed.success) {
        response.status(400).json({
          error: "invalid_chat_request",
          details: parsed.error.issues,
        })
        return
      }
      try {
        const result = await runAssistantChat(env, parsed.data)
        response.status(200).json({ ok: true, ...result })
      } catch (error) {
        const message = error instanceof Error ? error.message : "chat_failed"
        response.status(500).json({ error: "chat_failed", message })
      }
    },
  )

  app.post(
    "/api/chat/stream",
    corsGate,
    async (request: Request, response: Response): Promise<void> => {
      const parsed = chatBodySchema.safeParse(request.body)
      if (!parsed.success) {
        response.status(400).json({
          error: "invalid_chat_request",
          details: parsed.error.issues,
        })
        return
      }
      try {
        const prepared = await prepareAssistantChatStream(env, parsed.data)
        response.status(200)
        response.setHeader("Content-Type", "text/event-stream; charset=utf-8")
        response.setHeader("Cache-Control", "no-cache, no-transform")
        response.setHeader("Connection", "keep-alive")
        response.flushHeaders?.()

        writeSse(response, {
          type: "meta",
          sources: prepared.sources,
          backend: prepared.backend,
          model: prepared.model,
        })

        let emittedDelta = false
        if (prepared.textStream) {
          try {
            for await (const delta of prepared.textStream) {
              if (delta) {
                emittedDelta = true
                writeSse(response, { type: "delta", text: delta })
              }
            }
          } catch (streamError) {
            const message = streamError instanceof Error
              ? streamError.message
              : "chat_stream_failed"
            console.warn("[assistant] stream iteration failed; emitting fallback", streamError)
            writeSse(response, { type: "error", message })
            if (!emittedDelta && prepared.fallbackAnswer) {
              writeSse(response, { type: "delta", text: prepared.fallbackAnswer })
            }
            writeSse(response, { type: "done" })
            response.end()
            return
          }
        } else if (prepared.fallbackAnswer) {
          writeSse(response, { type: "delta", text: prepared.fallbackAnswer })
        }

        writeSse(response, { type: "done" })
        response.end()
      } catch (error) {
        const message = error instanceof Error ? error.message : "chat_failed"
        if (response.headersSent) {
          writeSse(response, { type: "error", message })
          writeSse(response, { type: "done" })
          response.end()
          return
        }
        response.status(500).json({ error: "chat_failed", message })
      }
    },
  )
}
