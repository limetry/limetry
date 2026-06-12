import type { ActionIntent } from "@limetry/sdk"
import { RemotePolicyEngine } from "@limetry/sdk"
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"

import { awsCostPolicy } from "./policy.js"

// Map simulated server resources to their hourly billing cost in minor units (cents)
const RESOURCE_COST_MAP: Record<string, number> = {
  /**
   * $0.10 / hour
   */
  "t3.micro": 10,
  /**
   * $1.00 / hour
   */
  "m5.large": 100,
  /**
   * $20.00 / hour (policy violation)
   */
  "g5.4xlarge": 2000,
}

/**
 * AWS Lambda handler triggered by a Slack Slash Command.
 * Example payload text formats: "t3.micro" or "g5.4xlarge"
 */
export async function lambdaHandler(
  event: APIGatewayProxyEvent,
  _context?: unknown,
  dependencies: { fetch?: typeof globalThis.fetch } = {},
): Promise<APIGatewayProxyResult> {
  try {
    // 1. Parse parameters from the URL encoded Slack request
    const bodyParams = new URLSearchParams(event.body || "")
    const resourceType = bodyParams.get("text") || "t3.micro"
    const user = bodyParams.get("user_name") || "unknown-user"

    // Simulate validation check
    const costMinor = RESOURCE_COST_MAP[resourceType]
    if (costMinor === undefined) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response_type: "ephemeral",
          text: `Error: Unknown resource type '${resourceType}'. Available options: t3.micro, m5.large, g5.4xlarge`,
        }),
      }
    }

    // 2. Setup Limetry Remote Engine
    const apiKey = process.env.LIMETRY_API_KEY || "mock-bearer-token"
    const baseUrl = process.env.LIMETRY_BASE_URL || "https://api.limetry.com"

    const engine = new RemotePolicyEngine({
      apiKey,
      baseUrl,
      fetch: dependencies.fetch,
    })

    // 3. Construct the ActionIntent for the cloud resource request
    const now = new Date()
    const intent: ActionIntent = {
      intent_id: `intent-${Date.now()}`,
      policy_id: awsCostPolicy.policy_id,
      agent_id: awsCostPolicy.agent_id,
      action_type: "aws_provision",
      resource: `aws:ec2:${resourceType}`,
      cost: {
        amount_minor: costMinor,
        currency: "USD",
      },
      metadata: {
        user,
        resourceType,
      },
      issued_at: now.toISOString(),
    }

    // 4. Evaluate using the Remote Policy Engine
    const result = await engine.evaluateAction(intent)

    if (!result.ok || !result.approved) {
      const reason = !result.ok
        ? result.error || "Remote engine connection error"
        : result.reasons?.join("; ") || "Policy evaluation rejected intent."

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response_type: "ephemeral",
          text: `🚨 Spend Blocked by Limetry AI Governance: Policy violation: ${reason}`,
        }),
      }
    }

    // 5. Return success if allowed
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        response_type: "in_channel",
        text: `✅ Infrastructure Provisioning Approved: Scaled resource to ${resourceType} ($${(costMinor / 100).toFixed(2)}/hr).`,
      }),
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error"
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `Internal processing error: ${errorMsg}`,
      }),
    }
  }
}
