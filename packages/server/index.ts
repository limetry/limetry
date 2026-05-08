/**
 * Vercel Express entry for `\@limetry/server` (Root Directory = packages/server).
 *
 * Imports `express` so Vercel detects this file as the serverless entrypoint.
 * Local `yarn start` still uses `src/index.ts` with {@link startServer}.
 */

import "express"

import { loadDotenv } from "./src/load-dotenv.js"

loadDotenv()

import { prepareApp } from "./src/create-app.js"
import { loadEnv } from "./src/env.js"

const env = loadEnv()
const { app } = await prepareApp(env)

/**
 * Express application prepared for Vercel without calling `listen()`.
 */
export default app
