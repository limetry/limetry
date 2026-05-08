/**
 * Local long-running entry for `\@limetry/server`.
 *
 * Loads monorepo dotenv, validates env via {@link loadEnv}, then binds the
 * Express app with {@link startServer}. Deployed Vercel and Lambda entrypoints
 * live in `packages/server/index.ts` and {@link handler} respectively.
 *
 * @packageDocumentation
 */

import { loadDotenv } from "./load-dotenv.js"

loadDotenv()

import { startServer } from "./create-app.js"
import { loadEnv } from "./env.js"
import { initServerTelemetry } from "./telemetry.js"

const env = loadEnv()
initServerTelemetry()
await startServer(env)
