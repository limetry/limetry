/**
 * Fastify route: public `POST /api/contact` via pluggable contact providers.
 */

import type { FastifyInstance, FastifyPluginAsync } from "fastify"

import type { AssistantEnv } from "../env.js"
import { errorJsonSchema } from "../schemas.js"
import { createContactProvider } from "./index.js"
import { parseContactMessage } from "./validate.js"

type ContactRoutesOpts = {
  env: AssistantEnv
}

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
 * @param opts - Plugin options including validated env.
 */
export const contactRoutes: FastifyPluginAsync<ContactRoutesOpts> = async (
  app,
  opts,
) => {
  const { env } = opts

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

      const provider = createContactProvider({
        CONTACT_PROVIDER: env.CONTACT_PROVIDER,
        BREVO_API_KEY: env.BREVO_API_KEY,
        BREVO_FROM_EMAIL: env.BREVO_FROM_EMAIL,
        BREVO_FROM_NAME: env.BREVO_FROM_NAME,
        BREVO_CONTACT_TO: env.BREVO_CONTACT_TO,
        RESEND_API_KEY: env.RESEND_API_KEY,
        RESEND_FROM_EMAIL: env.RESEND_FROM_EMAIL,
        RESEND_FROM_NAME: env.RESEND_FROM_NAME,
        RESEND_CONTACT_TO: env.RESEND_CONTACT_TO,
      })

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
 * @param env - Validated assistant env.
 */
export async function createContactRoutes(
  app: FastifyInstance,
  env: AssistantEnv,
): Promise<void> {
  await app.register(contactRoutes, { env })
}
