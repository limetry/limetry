import type { ShopifyActionFirewall } from "@limetry/shopify"

import { processCustomerRefund, type SupportToolOutcome } from "./agent-support.js"

export type SupportOpsToolName =
  | "issue_customer_refund"
  | "create_goodwill_discount"
  | "set_inventory_level"

export type JsonSchemaProperty = {
  type: "string" | "number"
  description: string
}

export type SupportOpsToolDefinition = {
  type: "function"
  function: {
    name: SupportOpsToolName
    description: string
    parameters: {
      type: "object"
      properties: Record<string, JsonSchemaProperty>
      required: string[]
    }
  }
}

export type SupportOpsToolArgs = {
  orderId?: string
  amountDollars?: number
  title?: string
  percentOff?: number
  inventoryItemId?: string
  locationId?: string
  available?: number
}

export type SupportOpsDispatchResult = SupportToolOutcome & {
  tool: SupportOpsToolName
}

/**
 * OpenAI / Anthropic-compatible tools for a Shopify support or ops agent.
 * The agent never receives SHOPIFY_ADMIN_TOKEN — the firewall holds it.
 */
export const SUPPORT_OPS_TOOLS: SupportOpsToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "issue_customer_refund",
      description:
        "Issue a goodwill refund on an order. Amounts under $25 may allow. $25–$50 require operator approval. Over $50 are denied. Never pass store tokens.",
      parameters: {
        type: "object",
        properties: {
          orderId: {
            type: "string",
            description: "Shopify order id",
          },
          amountDollars: {
            type: "number",
            description: "Refund amount in USD dollars",
          },
        },
        required: ["orderId", "amountDollars"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_goodwill_discount",
      description:
        "Create a store-wide percentage discount code. Evaluated as shopify.discount before Admin API mutate.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Discount title / code",
          },
          percentOff: {
            type: "number",
            description: "Percent off, e.g. 10",
          },
        },
        required: ["title", "percentOff"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_inventory_level",
      description:
        "Set on-hand inventory. This store policy denies shopify.inventory — support agents must not wipe stock.",
      parameters: {
        type: "object",
        properties: {
          inventoryItemId: {
            type: "string",
            description: "Inventory item id",
          },
          locationId: {
            type: "string",
            description: "Location id",
          },
          available: {
            type: "number",
            description: "New available quantity",
          },
        },
        required: ["inventoryItemId", "locationId", "available"],
      },
    },
  },
]

function toOutcome(
  tool: SupportOpsToolName,
  result: {
    evaluation: SupportToolOutcome["mutationResult"]["evaluation"]
    executed: boolean
  },
  mutationResult: SupportToolOutcome["mutationResult"],
): SupportOpsDispatchResult {
  const decision = result.evaluation.decision ?? (result.evaluation.approved ? "allow" : "deny")
  return {
    tool,
    success: decision === "allow",
    decision,
    executed: result.executed,
    reasons: result.evaluation.reasons ?? [],
    approval_id: result.evaluation.approval_id,
    mutationResult,
  }
}

/**
 * Dispatch a support/ops agent tool call through the Shopify firewall.
 */
export async function dispatchSupportOpsTool(
  firewall: ShopifyActionFirewall,
  tool: SupportOpsToolName,
  args: SupportOpsToolArgs,
): Promise<SupportOpsDispatchResult> {
  if (tool === "issue_customer_refund") {
    if (!args.orderId || args.amountDollars === undefined) {
      throw new Error("issue_customer_refund requires orderId and amountDollars")
    }
    const refund = await processCustomerRefund(firewall, args.orderId, args.amountDollars)
    return { ...refund, tool }
  }

  if (tool === "create_goodwill_discount") {
    if (!args.title || args.percentOff === undefined) {
      throw new Error("create_goodwill_discount requires title and percentOff")
    }
    const mutation = await firewall.createDiscount({
      title: args.title,
      percentOff: args.percentOff,
    })
    return toOutcome(tool, mutation, mutation)
  }

  if (!args.inventoryItemId || !args.locationId || args.available === undefined) {
    throw new Error("set_inventory_level requires inventoryItemId, locationId, and available")
  }
  const mutation = await firewall.updateInventory({
    inventoryItemId: args.inventoryItemId,
    locationId: args.locationId,
    available: args.available,
  })
  return toOutcome(tool, mutation, mutation)
}
