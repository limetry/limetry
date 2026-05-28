/**
 * AWS Lambda / API Gateway HTTP API (payload 2.0) adapter for `\@limetry/server`.
 */

import { configure as serverlessExpress } from "@codegenie/serverless-express"
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from "aws-lambda"

import { prepareApp } from "./create-app.js"
import { loadEnv } from "./env.js"
import { initServerTelemetry } from "./telemetry.js"

/**
 * Promise-only Lambda handler (Node.js 24+ rejects callback-style handlers).
 */
type ProxyHandler = (
  event: APIGatewayProxyEventV2,
  context: Context,
) => Promise<APIGatewayProxyStructuredResultV2>

/**
 * Warm-start cache for the serverless-express proxy.
 */
let cachedHandler: ProxyHandler | undefined

/**
 * Lazily builds and caches the Express-backed Lambda proxy handler.
 *
 * @returns Configured serverless-express handler.
 * @throws When {@link loadEnv} or {@link prepareApp} fails (invalid env, DB, Redis).
 */
async function resolveHandler(): Promise<ProxyHandler> {
  if (cachedHandler) {
    return cachedHandler
  }

  const env = loadEnv()
  initServerTelemetry()
  const { app } = await prepareApp(env)
  cachedHandler = serverlessExpress({ app }) as unknown as ProxyHandler
  return cachedHandler
}

/**
 * API Gateway HTTP API (payload 2.0) entrypoint for the Limetry Express server.
 *
 * Node.js 24+ Lambda runtimes reject callback-based handlers; this export is
 * promise-only (no third `callback` argument).
 *
 * @param event - API Gateway HTTP API proxy event.
 * @param context - Lambda invocation context.
 * @returns Structured API Gateway proxy result.
 * @throws When env validation, store wiring, or the underlying handler fails.
 */
export async function handler(
  event: APIGatewayProxyEventV2,
  context: Context,
): Promise<APIGatewayProxyStructuredResultV2> {
  const resolved = await resolveHandler()
  const result = await resolved(event, context)
  return result as APIGatewayProxyStructuredResultV2
}
