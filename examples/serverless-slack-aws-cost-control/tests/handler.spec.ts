import type { APIGatewayProxyEvent } from "aws-lambda"
import { describe, expect, it } from "vitest"

import { lambdaHandler } from "../src/handler.js"

describe("Serverless AWS Slack Cost Control Demo", () => {
  const createMockEvent = (text: string): APIGatewayProxyEvent =>
    ({
      body: `command=%2Fprovision-infra&text=${encodeURIComponent(text)}&user_name=alice`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      httpMethod: "POST",
      isBase64Encoded: false,
      path: "/slack/command",
      pathParameters: null,
      queryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: "",
    } as unknown as APIGatewayProxyEvent)

  it("approves scaling up to t3.micro ($0.10/hr) within single transaction limits", async () => {
    // Setup mock fetch that returns successful policy evaluation
    const mockFetch = async () =>
      new Response(
        JSON.stringify({
          ok: true,
          approved: true,
          decision: "allow",
          reasons: [],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )

    const event = createMockEvent("t3.micro")
    const response = await lambdaHandler(event, {}, { fetch: mockFetch as any })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.response_type).toBe("in_channel")
    expect(body.text).toContain("Approved")
    expect(body.text).toContain("t3.micro")
  })

  it("blocks scaling up to g5.4xlarge ($20.00/hr) due to policy limit breach ($10 limit)", async () => {
    // Setup mock fetch returning policy breach violation
    const mockFetch = async () =>
      new Response(
        JSON.stringify({
          ok: true,
          approved: false,
          decision: "deny",
          reasons: ["cost 2000 exceeds max_cost_minor 1000"],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )

    const event = createMockEvent("g5.4xlarge")
    const response = await lambdaHandler(event, {}, { fetch: mockFetch as any })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.response_type).toBe("ephemeral")
    expect(body.text).toContain("Blocked")
    expect(body.text).toContain("cost 2000 exceeds max_cost_minor 1000")
  })

  it("gracefully reports engine communication failure", async () => {
    // Setup mock fetch returning HTTP 500 error
    const mockFetch = async () =>
      new Response("Internal Server Error", {
        status: 500,
      })

    const event = createMockEvent("t3.micro")
    const response = await lambdaHandler(event, {}, { fetch: mockFetch as any })

    expect(response.statusCode).toBe(500)
    const body = JSON.parse(response.body)
    expect(body.text).toContain("Internal processing error")
  })
})
