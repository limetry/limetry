/**
 * AWS Lambda / Function URL (API Gateway HTTP API payload 2.0) adapter.
 */

import awsLambdaFastify from "@fastify/aws-lambda"
import { loadAssistantEnv } from "@limetry/assistant"
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from "aws-lambda"
import type { FastifyInstance } from "fastify"

import { createApiApp } from "./create-app.js"

/**
 * Promise-only Lambda handler (Node.js 24+ rejects callback-style handlers).
 */
type ProxyHandler = (
  event: APIGatewayProxyEventV2,
  context: Context,
) => Promise<APIGatewayProxyStructuredResultV2>

let cachedApp: FastifyInstance | undefined
let cachedHandler: ProxyHandler | undefined

/**
 * Lazily builds and caches the Fastify-backed Lambda proxy handler.
 *
 * @returns Configured `@fastify/aws-lambda` handler.
 */
async function resolveHandler(): Promise<ProxyHandler> {
  if (cachedHandler) {
    return cachedHandler
  }
  const env = loadAssistantEnv()
  const app = await createApiApp(env)
  // Register `@fastify/aws-lambda` before `ready()` — it decorates the request
  // and throws FST_ERR_DEC_AFTER_START if the app has already started.
  const proxy = awsLambdaFastify(app, {
    binaryMimeTypes: ["application/octet-stream"],
  })
  await app.ready()
  cachedApp = app
  cachedHandler = async (event, context) => {
    const result = await proxy(event, context)
    return result as APIGatewayProxyStructuredResultV2
  }
  return cachedHandler
}

/**
 * Lambda entry for Limetry.org public API (Ask Limetry + contact).
 *
 * @param event - API Gateway / Function URL event.
 * @param context - Lambda context.
 * @returns Proxy result.
 */
export async function handler(
  event: APIGatewayProxyEventV2,
  context: Context,
): Promise<APIGatewayProxyStructuredResultV2> {
  const resolved = await resolveHandler()
  return resolved(event, context)
}

/**
 * Test helper: returns the warm Fastify app when the Lambda handler has run.
 *
 * @returns Cached app or undefined.
 */
export function getCachedApiApp(): FastifyInstance | undefined {
  return cachedApp
}
