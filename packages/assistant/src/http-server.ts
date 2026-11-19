/**
 * Local HTTP server for Ask Limetry (`yarn workspace @limetry/assistant dev`).
 */

import { createAssistantApp } from "./create-app.js"
import { loadAssistantEnv } from "./env.js"

const env = loadAssistantEnv()
const app = await createAssistantApp(env)
const port = env.ASSISTANT_PORT

await app.listen({ port, host: "127.0.0.1" })
console.log(`[assistant] Ask Limetry listening on http://127.0.0.1:${port}`)
console.log("[assistant] POST /api/assistant and /api/assistant/stream")
console.log(`[assistant] OpenAPI UI http://127.0.0.1:${port}/api/assistant/docs`)
