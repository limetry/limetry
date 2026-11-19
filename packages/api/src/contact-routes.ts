/**
 * Fastify route: public `POST /api/contact` via in-package contact providers.
 */

import { errorJsonSchema } from "@limetry/assistant"

import { createContactProvider } from "./contact/index.js"
import { parseContactMessage } from "./contact/validate.js"
import type { FastifyInstance, FastifyPluginAsync } from "fastify"

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
          412: errorJsonSchema,
          502: errorJsonSchema,
        },
      },
    },
    async (request, reply) => {
      const parsed = parseContactMessage(request.body)
      if (!parsed.ok) {
        return reply.status(400).send({ error: parsed.error })
      }

      const provider = createContactProvider(process.env)
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
