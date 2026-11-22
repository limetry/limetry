/**
 * Fastify app factory for Limetry.org public API (`@limetry/api`).
 *
 * OpenAPI JSON is served from this app; Swagger UI lives on the static site at
 * `/openapi/assistant/` (CDN assets) so the Lambda bundle does not need
 * `@fastify/swagger-ui` static files.
 */

import swagger from "@fastify/swagger"
import {
  type AssistantEnv,
  healthJsonSchema,
} from "@limetry/assistant"
import { AppVersion } from "@limetry/sdk"
import Fastify, { type FastifyInstance } from "fastify"

import { createChatRoutes } from "./assistant-routes.js"
import { createContactRoutes } from "./contact-routes.js"
import { prefersHtml, renderAskApiStatusHtml } from "./presentation/status-html.js"

/** Marketing-site Swagger UI path (outside CloudFront `/api*` → Lambda). */
export const PUBLIC_API_SWAGGER_PATH = "/openapi/assistant/"

/** Canonical OpenAPI JSON path on the public API. */
export const PUBLIC_API_OPENAPI_JSON_PATH = "/api/assistant/openapi.json"

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

  app.get(
    PUBLIC_API_OPENAPI_JSON_PATH,
    {
      schema: {
        tags: ["assistant"],
        summary: "OpenAPI 3 document (JSON)",
        hide: true,
      },
    },
    async () => app.swagger(),
  )

  // Compat with the former @fastify/swagger-ui JSON path.
  app.get(
    "/api/assistant/docs/json",
    {
      schema: {
        hide: true,
      },
    },
    async (_request, reply) => reply.redirect(PUBLIC_API_OPENAPI_JSON_PATH, 302),
  )

  // Old UI path → static-site Swagger (CDN); keeps bookmarks working.
  app.get(
    "/api/assistant/docs",
    {
      schema: {
        hide: true,
      },
    },
    async (_request, reply) => reply.redirect(PUBLIC_API_SWAGGER_PATH, 302),
  )

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
        + `See POST /api/assistant, POST /api/contact, or ${PUBLIC_API_SWAGGER_PATH}.`,
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
