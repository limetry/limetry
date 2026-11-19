/**
 * Local HTTP server for Limetry.org public API (`yarn workspace @limetry/api dev`).
 */

import { loadAssistantEnv } from "@limetry/assistant"

import { createApiApp } from "./create-app.js"

const env = loadAssistantEnv()
const app = await createApiApp(env)
const port = env.ASSISTANT_PORT

await app.listen({ port, host: "127.0.0.1" })
console.log(`[api] Limetry public API listening on http://127.0.0.1:${port}`)
console.log("[api] POST /api/assistant, /api/assistant/stream, /api/contact")
console.log(`[api] OpenAPI UI http://127.0.0.1:${port}/api/assistant/docs`)
