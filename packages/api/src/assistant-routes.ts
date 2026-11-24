/**
 * Ask Limetry Fastify routes (`POST /api/assistant`, `POST /api/assistant/stream`).
 *
 * Same-origin only via limetry.org CloudFront / Next rewrites — no CORS.
 */

import {
  type AssistantChatRequest,
  type AssistantEnv,
  chatBodyJsonSchema,
  chatSuccessJsonSchema,
  errorJsonSchema,
  prepareAssistantChatStream,
  runAssistantChat,
} from "@limetry/assistant"
import type { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify"

import { logAssistantChatEvent } from "./site-audit-log.js"

type AssistantRoutesOpts = {
  env: AssistantEnv
}

/**
 * Enforces bearer auth when Ask Limetry is not public.
 *
 * @param request - Incoming request.
 * @param env - Assistant env.
 * @returns Error payload when denied; otherwise null.
 */
function chatAuthDenial(
  request: FastifyRequest,
  env: AssistantEnv,
): { status: number, error: string } | null {
  if (env.LIMETRY_ASSISTANT_PUBLIC) {
    return null
  }
  const expected = env.LIMETRY_ASSISTANT_BEARER_TOKEN
  if (!expected) {
    return { status: 503, error: "assistant_auth_misconfigured" }
  }
  const header = request.headers.authorization
  if (typeof header !== "string" || !header.startsWith("Bearer ")) {
    return { status: 401, error: "assistant_auth_required" }
  }
  const token = header.slice("Bearer ".length).trim()
  if (token !== expected) {
    return { status: 401, error: "assistant_auth_invalid" }
  }
  return null
}

/**
 * Writes one SSE data event to the raw Node response.
 *
 * @param reply - Fastify reply (hijacked for streaming).
 * @param payload - JSON-serializable event body.
 */
function writeSse(reply: FastifyReply, payload: unknown): void {
  reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`)
}

/**
 * Fastify plugin registering Ask Limetry chat endpoints.
 *
 * @param app - Fastify instance.
 * @param opts - Plugin options including validated env.
 */
export const assistantRoutes: FastifyPluginAsync<AssistantRoutesOpts> = async (
  app,
  opts,
) => {
  const { env } = opts

  app.addHook("preHandler", async (request, reply) => {
    if (!request.url.startsWith("/api/assistant")) {
      return
    }
    if (request.method === "OPTIONS" || request.method === "GET") {
      return
    }
    const denial = chatAuthDenial(request, env)
    if (denial) {
      return reply.status(denial.status).send({ error: denial.error })
    }
  })

  app.post<{ Body: AssistantChatRequest }>(
    "/api/assistant",
    {
      schema: {
        tags: ["assistant"],
        summary: "Ask Limetry (JSON)",
        description: "Retrieve Limetry docs and synthesize a grounded answer.",
        body: chatBodyJsonSchema,
        response: {
          200: chatSuccessJsonSchema,
          400: errorJsonSchema,
          401: errorJsonSchema,
          500: errorJsonSchema,
          503: errorJsonSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await runAssistantChat(env, request.body)
        try {
          await logAssistantChatEvent({
            message: request.body.message,
            answer: result.answer,
            sources: result.sources,
            backend: result.backend,
            model: result.model,
          })
        } catch (logError) {
          console.error("[api] assistant site-audit log failed", logError)
        }
        return reply.status(200).send({ ok: true, ...result })
      } catch (error) {
        const message = error instanceof Error ? error.message : "chat_failed"
        return reply.status(500).send({ error: "chat_failed", message })
      }
    },
  )

  app.post<{ Body: AssistantChatRequest }>(
    "/api/assistant/stream",
    {
      schema: {
        tags: ["assistant"],
        summary: "Ask Limetry (SSE stream)",
        description:
          "Same as JSON chat, but streams `meta` / `delta` / `error` / `done` SSE events. "
          + "Response body is text/event-stream (not JSON Schema validated).",
        body: chatBodyJsonSchema,
        response: {
          400: errorJsonSchema,
          401: errorJsonSchema,
          500: errorJsonSchema,
          503: errorJsonSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const prepared = await prepareAssistantChatStream(env, request.body)

        reply.hijack()
        reply.raw.writeHead(200, {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        })

        writeSse(reply, {
          type: "meta",
          sources: prepared.sources,
          backend: prepared.backend,
          model: prepared.model,
        })

        let emittedDelta = false
        const answerParts: string[] = []
        if (prepared.textStream) {
          try {
            for await (const delta of prepared.textStream) {
              if (delta) {
                emittedDelta = true
                answerParts.push(delta)
                writeSse(reply, { type: "delta", text: delta })
              }
            }
          } catch (streamError) {
            const message = streamError instanceof Error
              ? streamError.message
              : "chat_stream_failed"
            console.warn("[api] stream iteration failed; emitting fallback", streamError)
            writeSse(reply, { type: "error", message })
            if (!emittedDelta && prepared.fallbackAnswer) {
              answerParts.push(prepared.fallbackAnswer)
              writeSse(reply, { type: "delta", text: prepared.fallbackAnswer })
            }
            try {
              await logAssistantChatEvent({
                message: request.body.message,
                answer: answerParts.join(""),
                sources: prepared.sources,
                backend: prepared.backend,
                model: prepared.model,
                streamError: message,
              })
            } catch (logError) {
              console.error("[api] assistant stream site-audit log failed", logError)
            }
            writeSse(reply, { type: "done" })
            reply.raw.end()
            return
          }
        } else if (prepared.fallbackAnswer) {
          answerParts.push(prepared.fallbackAnswer)
          writeSse(reply, { type: "delta", text: prepared.fallbackAnswer })
        }

        try {
          await logAssistantChatEvent({
            message: request.body.message,
            answer: answerParts.join(""),
            sources: prepared.sources,
            backend: prepared.backend,
            model: prepared.model,
          })
        } catch (logError) {
          console.error("[api] assistant stream site-audit log failed", logError)
        }
        writeSse(reply, { type: "done" })
        reply.raw.end()
      } catch (error) {
        const message = error instanceof Error ? error.message : "chat_failed"
        if (reply.raw.headersSent) {
          writeSse(reply, { type: "error", message })
          writeSse(reply, { type: "done" })
          reply.raw.end()
          return
        }
        return reply.status(500).send({ error: "chat_failed", message })
      }
    },
  )
}

/**
 * Registers Ask Limetry routes on a Fastify instance.
 *
 * @param app - Fastify app.
 * @param env - Validated assistant env.
 */
export async function createChatRoutes(
  app: FastifyInstance,
  env: AssistantEnv,
): Promise<void> {
  await app.register(assistantRoutes, { env })
}
