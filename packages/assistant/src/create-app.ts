/**
 * Fastify app factory for Ask Limetry (`@limetry/assistant`).
 */

import swagger from "@fastify/swagger"
import swaggerUi from "@fastify/swagger-ui"
import Fastify, { type FastifyInstance } from "fastify"

import { createContactRoutes } from "./contact/routes.js"
import type { AssistantEnv } from "./env.js"
import { createChatRoutes } from "./http-routes.js"
import { healthJsonSchema } from "./schemas.js"

/**
 * Builds the Ask Limetry HTTP app (`/api/assistant*`, `/api/contact`, health, OpenAPI).
 *
 * @param env - Validated assistant env.
 * @returns Configured Fastify instance (call `ready()` before inject/listen).
 */
export async function createAssistantApp(
  env: AssistantEnv,
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
    bodyLimit: 256 * 1024,
    ajv: {
      customOptions: {
        removeAdditional: "failing",
        coerceTypes: false,
      },
    },
  })

  await app.register(swagger, {
    openapi: {
      info: {
        title: "Ask Limetry",
        description:
          "Product assistant and contact form for Limetry (open-source) and Limetry Cloud. "
          + "Served same-origin at https://limetry.org/api/assistant and /api/contact.",
        version: "1.0.0",
      },
      tags: [
        { name: "assistant", description: "Docs Q&A" },
        { name: "contact", description: "Public contact form" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            description:
              "Required when LIMETRY_ASSISTANT_PUBLIC=false "
              + "(Authorization: Bearer <LIMETRY_ASSISTANT_BEARER_TOKEN>).",
          },
        },
      },
    },
  })

  await app.register(swaggerUi, {
    routePrefix: "/api/assistant/docs",
    staticCSP: true,
  })

  app.get(
    "/health",
    {
      schema: {
        tags: ["assistant"],
        summary: "Health check",
        response: { 200: healthJsonSchema },
      },
    },
    async () => ({ ok: true as const, service: "ask-limetry" as const }),
  )

  await createChatRoutes(app, env)
  await createContactRoutes(app, env)

  app.setNotFoundHandler(async (request, reply) => {
    if (request.url.startsWith("/api")) {
      return reply.status(404).send({ error: "not_found" })
    }
    return reply.status(404).send({ error: "not_found" })
  })

  return app
}
