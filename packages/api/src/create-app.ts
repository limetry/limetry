/**
 * Fastify app factory for Limetry.org public API (`@limetry/api`).
 */

import swagger from "@fastify/swagger"
import swaggerUi from "@fastify/swagger-ui"
import {
  type AssistantEnv,
  healthJsonSchema,
} from "@limetry/assistant"
import { AppVersion } from "@limetry/sdk"
import Fastify, { type FastifyInstance } from "fastify"

import { createChatRoutes } from "./assistant-routes.js"
import { createContactRoutes } from "./contact-routes.js"
import { prefersHtml, renderAskApiStatusHtml } from "./presentation/status-html.js"

/**
 * Builds the public HTTP app (`/api/assistant*`, `/api/contact`, health, OpenAPI).
 *
 * @param env - Validated assistant env (contact credentials read from process.env).
 * @returns Configured Fastify instance (call `ready()` before inject/listen).
 */
export async function createApiApp(
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

  const appVersion = AppVersion()

  await app.register(swagger, {
    openapi: {
      info: {
        title: "Limetry public API",
        description: `Limetry API for limetry.org. App ${appVersion}`,
        version: "1.0.0",
        "x-limetry-app-version": appVersion,
      } as {
        title: string
        description: string
        version: string
        "x-limetry-app-version": string
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
    async () => ({
      ok: true as const,
      service: "ask-limetry" as const,
      version: appVersion,
    }),
  )

  await createChatRoutes(app, env)
  await createContactRoutes(app)

  app.setNotFoundHandler(async (request, reply) => {
    const path = request.url.split("?")[0] ?? request.url
    if (prefersHtml(request.headers.accept)) {
      return reply
        .status(404)
        .type("text/html; charset=utf-8")
        .send(renderAskApiStatusHtml("not-found", path))
    }
    return reply.status(404).send({
      error: "not_found",
      message:
        "No matching route on the limetry.org public API. "
        + "See POST /api/assistant, POST /api/contact, or /api/assistant/docs.",
      path,
    })
  })

  app.setErrorHandler(async (error, request, reply) => {
    if (typeof request.log?.error === "function") {
      request.log.error(error)
    } else {
      console.error(error)
    }
    const path = request.url.split("?")[0] ?? request.url
    if (prefersHtml(request.headers.accept)) {
      return reply
        .status(500)
        .type("text/html; charset=utf-8")
        .send(renderAskApiStatusHtml("error", path))
    }
    return reply.status(500).send({
      error: "internal_error",
      message: "Unexpected failure while handling this request.",
      path,
    })
  })

  return app
}

/** @deprecated Use {@link createApiApp}. */
export const createAssistantApp = createApiApp
