/**
 * Local HTTP server for Ask Limetry (`yarn workspace @limetry/assistant dev`).
 */

import { createAssistantApp } from "./create-app.js"
import { loadAssistantEnv } from "./env.js"

const env = loadAssistantEnv()
const app = createAssistantApp(env)
const port = env.ASSISTANT_PORT

app.listen(port, () => {
  console.log(`[assistant] Ask Limetry listening on http://127.0.0.1:${port}`)
  console.log("[assistant] POST /api/chat and /api/chat/stream")
})
