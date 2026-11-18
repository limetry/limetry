/**
 * Express app factory for Ask Limetry (`@limetry/assistant`).
 */

import express, { type Express } from "express"

import type { AssistantEnv } from "./env.js"
import { createChatRoutes } from "./http-routes.js"

/**
 * Builds the Ask Limetry HTTP app (`/api/chat*`, health).
 *
 * @param env - Validated assistant env.
 * @returns Configured Express app.
 */
export function createAssistantApp(env: AssistantEnv): Express {
  const app = express()
  app.disable("x-powered-by")
  app.use(express.json({ limit: "256kb" }))

  app.get("/health", (_request, response) => {
    response.status(200).json({ ok: true, service: "ask-limetry" })
  })

  createChatRoutes(app, env)

  app.use("/api", (_request, response) => {
    response.status(404).json({ error: "not_found" })
  })

  return app
}
