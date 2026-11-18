/**
 * AWS Lambda / Function URL (API Gateway HTTP API payload 2.0) adapter.
 */

import { configure as serverlessExpress } from "@codegenie/serverless-express"
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from "aws-lambda"

import { createAssistantApp } from "./create-app.js"
import { loadAssistantEnv } from "./env.js"

/**
 * Promise-only Lambda handler (Node.js 24+ rejects callback-style handlers).
 */
type ProxyHandler = (
  event: APIGatewayProxyEventV2,
  context: Context,
) => Promise<APIGatewayProxyStructuredResultV2>

let cachedHandler: ProxyHandler | undefined

/**
 * Lazily builds and caches the Express-backed Lambda proxy handler.
 *
 * @returns Configured serverless-express handler.
 */
async function resolveHandler(): Promise<ProxyHandler> {
  if (cachedHandler) {
    return cachedHandler
  }
  const env = loadAssistantEnv()
  const app = createAssistantApp(env)
  cachedHandler = serverlessExpress({ app }) as unknown as ProxyHandler
  return cachedHandler
}

/**
 * Lambda entry for Ask Limetry.
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
