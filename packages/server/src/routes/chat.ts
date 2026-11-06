/**
 * Docs RAG chat HTTP route (`POST /v1/chat`).
 */

import type { Express, NextFunction, Request, Response } from "express"
import { z } from "zod"

import type { ServerEnv } from "../env.js"
import { resolveLandingWebOrigin } from "../landing-links.js"
import {
  createBearerAuthMiddleware,
  requireScopes,
} from "../middleware/bearer-auth.js"
import { runRagChat } from "../services/rag/chat.js"
import type { UserService } from "../services/user-service.js"

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
 * Production serves the same site on both `limetry.org` and `www.limetry.org`;
 * browsers send whichever host the user opened as `Origin`.
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
 * Builds allowed browser origins for the docs chat UI.
 *
 * @param env - Server env (unused today; reserved for future allowlists).
 * @returns Origin strings that may call `/v1/chat` from the browser.
 */
function chatCorsOrigins(_env: ServerEnv): string[] {
  const origins = new Set<string>([
    ...chatCorsOriginVariants(resolveLandingWebOrigin()),
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3800",
    "http://127.0.0.1:3800",
  ])
  const extra = process.env.LIMETRY_RAG_CORS_ORIGINS
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
 * Applies CORS headers for browser docs chat requests.
 *
 * @param request - Incoming request.
 * @param response - Outgoing response.
 * @param env - Server env.
 * @returns Whether the request Origin was allowed (or absent).
 */
function applyChatCors(
  request: Request,
  response: Response,
  env: ServerEnv,
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
    "Content-Type, Authorization",
  )
  response.setHeader("Access-Control-Max-Age", "86400")
  return true
}

/**
 * Registers the Limetry docs assistant chat endpoint.
 *
 * @param app - Express app.
 * @param env - Validated server env.
 * @param userService - User/token store for optional auth.
 */
export function createChatRoutes(
  app: Express,
  env: ServerEnv,
  userService: UserService,
): void {
  app.options("/v1/chat", (request, response) => {
    if (!applyChatCors(request, response, env)) {
      response.status(403).end()
      return
    }
    response.status(204).end()
  })

  const handlers = [
    (request: Request, response: Response, next: NextFunction): void => {
      if (!applyChatCors(request, response, env)) {
        response.status(403).json({ error: "cors_origin_denied" })
        return
      }
      next()
    },
    ...(env.LIMETRY_RAG_CHAT_PUBLIC
      ? []
      : [
        createBearerAuthMiddleware(env, userService),
        requireScopes("chat:read"),
      ]),
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
        const result = await runRagChat(env, parsed.data)
        response.status(200).json({ ok: true, ...result })
      } catch (error) {
        const message = error instanceof Error ? error.message : "chat_failed"
        response.status(500).json({ error: "chat_failed", message })
      }
    },
  ]

  app.post("/v1/chat", ...handlers)
}
