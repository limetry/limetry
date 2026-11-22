/**
 * Local HTTP server for Limetry.org public API (`yarn workspace @limetry/api dev`).
 */

import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { loadAssistantEnv } from "@limetry/assistant"
import { seedDevVersionEnv } from "@limetry/preflight"
import { AppVersion } from "@limetry/sdk"

import { createApiApp } from "./create-app.js"

seedDevVersionEnv(resolve(dirname(fileURLToPath(import.meta.url)), "../../.."))

const env = loadAssistantEnv()
const app = await createApiApp(env)
const port = env.ASSISTANT_PORT

await app.listen({ port, host: "127.0.0.1" })
console.log(`[api] Limetry public API listening on http://127.0.0.1:${port} (${AppVersion()})`)
console.log("[api] POST /api/assistant, /api/assistant/stream, /api/contact")
console.log(`[api] OpenAPI JSON http://127.0.0.1:${port}/api/assistant/openapi.json`)
console.log("[api] Swagger UI (static site) /openapi/assistant/")
