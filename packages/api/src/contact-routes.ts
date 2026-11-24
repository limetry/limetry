/**
 * Fastify route: public `POST /api/contact` via in-package contact providers.
 */

import { errorJsonSchema } from "@limetry/assistant"
import type { FastifyInstance, FastifyPluginAsync } from "fastify"

import {
  contactOptionsFromEnv,
  createContactProvider,
} from "./contact/index.js"
import { parseContactMessage } from "./contact/validate.js"
import { logContactSubmitEvent } from "./site-audit-log.js"
import {
  clientIpFromHeaders,
  consumeContactRateLimit,
} from "./turnstile/rate-limit.js"
import {
  parseTurnstileHostnames,
  resolveTurnstileSecret,
  verifyTurnstileToken,
} from "./turnstile/verify.js"

const contactBodyJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["name", "email", "message"],
  properties: {
    name: { type: "string", minLength: 2, maxLength: 120 },
    email: { type: "string", minLength: 3, maxLength: 254 },
    company: { type: "string", maxLength: 160 },
    message: { type: "string", minLength: 10, maxLength: 5_000 },
    source: { type: "string", maxLength: 80 },
    turnstileToken: { type: "string", maxLength: 2048 },
  },
} as const

const contactSuccessJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["ok"],
  properties: {
    ok: { type: "boolean", const: true },
    detail: { type: "string" },
    messageId: { type: ["string", "null"] },
  },
} as const

/**
 * Registers the public contact-form endpoint.
 *
 * @param app - Fastify instance.
 */
export const contactRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/api/contact",
    {
      schema: {
        tags: ["contact"],
        summary: "Submit the public contact form",
        body: contactBodyJsonSchema,
        response: {
          200: contactSuccessJsonSchema,
          400: errorJsonSchema,
          403: errorJsonSchema,
          412: errorJsonSchema,
          429: errorJsonSchema,
          502: errorJsonSchema,
        },
      },
    },
    async (request, reply) => {
      const ip = clientIpFromHeaders(
        request.headers as Record<string, string | string[] | undefined>,
      )
      const rate = consumeContactRateLimit({ key: `contact:${ip}` })
      if (!rate.allowed) {
        reply.header("Retry-After", String(rate.retryAfterSec))
        return reply.status(429).send({ error: "Too many contact attempts — try again shortly" })
      }

      const body = request.body as Record<string, unknown> | undefined
      const turnstile = await verifyTurnstileToken({
        token: body?.turnstileToken,
        secret: resolveTurnstileSecret(process.env),
        expectedAction: "contact",
        expectedHostnames: parseTurnstileHostnames(process.env.TURNSTILE_HOSTNAMES),
        remoteIp: ip === "unknown" ? undefined : ip,
      })
      if (!turnstile.ok) {
        return reply.status(turnstile.status).send({ error: turnstile.error })
      }

      const parsed = parseContactMessage(request.body)
      if (!parsed.ok) {
        return reply.status(400).send({ error: parsed.error })
      }

      const provider = createContactProvider(contactOptionsFromEnv(process.env))
      if (!provider) {
        return reply.status(412).send({ error: "Contact email is not configured" })
      }

      const result = await provider.send(parsed.message)
      if (!result.ok) {
        console.error("contact.send_failed", {
          provider: provider.id,
          error: result.error,
        })
        return reply.status(502).send({ error: "Unable to send your message" })
      }

      try {
        await logContactSubmitEvent({
          name: parsed.message.name,
          email: parsed.message.email,
          company: parsed.message.company,
          message: parsed.message.message,
          source: parsed.message.source,
          messageId: result.messageId ?? null,
          provider: provider.id,
        })
      } catch (logError) {
        console.error("[api] contact site-audit log failed", logError)
      }

      return {
        ok: true as const,
        detail: `Contact form sent via ${provider.id}`,
        messageId: result.messageId ?? null,
      }
    },
  )
}

/**
 * Registers contact routes on an existing Fastify app.
 *
 * @param app - Fastify instance.
 */
export async function createContactRoutes(app: FastifyInstance): Promise<void> {
  await app.register(contactRoutes)
}
