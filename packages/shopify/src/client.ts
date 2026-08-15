/**
 * Shopify Admin mutation firewall that evaluates ActionIntents before mutate.
 */

import { randomUUID } from "node:crypto"

import {
  type ActionEvaluationResponse,
  type ActionIntent,
  RemotePolicyEngine,
} from "@limetry/sdk"

/**
 * Successful ActionEvaluationResponse (`ok: true`) from `\@limetry/sdk`.
 */
type OkActionEvaluation = Extract<ActionEvaluationResponse, { ok: true }>

/**
 * Construction options for {@link ShopifyActionFirewall}.
 */
export type ShopifyFirewallOptions = {
  /**
   * Shop hostname (with or without `https://` prefix).
   */
  shopDomain: string
  /**
   * Shopify Admin API access token; never returned to callers.
   */
  adminToken: string
  /**
   * Admin API version segment; defaults to `2025-01`.
   */
  apiVersion?: string
  /**
   * Limetry API key / bearer token.
   */
  apiKey: string
  /**
   * Limetry API base URL.
   */
  baseUrl?: string
  /**
   * Tenant id for multi-tenant evaluation.
   */
  tenantId?: string
  /**
   * ActionPolicy id used for every mutation intent.
   */
  policyId: string
  /**
   * Agent id recorded on intents; defaults to `shopify_agent`.
   */
  agentId?: string
  /**
   * Default dry-run mode; defaults to `true` (evaluate only, no Admin call).
   */
  dryRun?: boolean
  /**
   * Optional fetch implementation for tests.
   */
  fetch?: typeof globalThis.fetch
}

/**
 * Result of a governed Shopify mutation attempt.
 */
export type ShopifyMutationResult = {
  /**
   * ActionIntent submitted for evaluation.
   */
  intent: ActionIntent
  /**
   * Successful remote evaluation response.
   */
  evaluation: OkActionEvaluation
  /**
   * Whether this call ran in dry-run mode.
   */
  dryRun: boolean
  /**
   * `true` only when decision was `allow` and dry-run was false, so Admin API ran.
   */
  executed: boolean
  /**
   * Parsed Admin API JSON when `executed` is true.
   */
  response?: unknown
}

/**
 * Holds the Shopify Admin token and only mutates after Limetry `allow`.
 *
 * Default `dryRun` is `true`: evaluation still runs, but Admin API is not called.
 * Execution requires `decision === "allow"` and `dryRun === false`.
 */
export class ShopifyActionFirewall {
  private readonly shopDomain: string
  private readonly adminToken: string
  private readonly apiVersion: string
  private readonly engine: RemotePolicyEngine
  private readonly policyId: string
  private readonly agentId: string
  private readonly dryRunDefault: boolean
  private readonly fetcher: typeof globalThis.fetch

  /**
   * @param options - Shop credentials, Limetry API settings, and dry-run default.
   */
  constructor(options: ShopifyFirewallOptions) {
    this.shopDomain = options.shopDomain.replace(/^https?:\/\//, "").replace(/\/$/, "")
    this.adminToken = options.adminToken
    this.apiVersion = options.apiVersion ?? "2025-01"
    this.policyId = options.policyId
    this.agentId = options.agentId ?? "shopify_agent"
    this.dryRunDefault = options.dryRun ?? true
    this.fetcher = options.fetch ?? globalThis.fetch
    this.engine = new RemotePolicyEngine({
      apiKey: options.apiKey,
      baseUrl: options.baseUrl,
      tenantId: options.tenantId,
      fetch: this.fetcher,
    })
  }

  /**
   * Evaluate (and optionally execute) a refund against an order.
   *
   * Action type: `shopify.refund`. Includes cost metadata in minor units.
   *
   * @param input - Order id, refund amount, optional currency and dry-run override.
   * @returns Evaluation result and optional Admin API response.
   * @throws Error When Limetry evaluation fails or Admin API returns non-OK.
   */
  async createRefund(input: {
    orderId: string
    amountMinor: number
    currency?: string
    dryRun?: boolean
  }): Promise<ShopifyMutationResult> {
    return this.mutate({
      actionType: "shopify.refund",
      resource: `shop:${this.shopDomain}/orders/${input.orderId}`,
      cost: {
        amount_minor: input.amountMinor,
        currency: input.currency ?? "USD",
      },
      dryRun: input.dryRun,
      body: {
        refund: {
          currency: input.currency ?? "USD",
          notify: false,
          note: "limetry-governed-refund",
          transactions: [{
            parent_id: null,
            amount: (input.amountMinor / 100).toFixed(2),
            kind: "refund",
            gateway: "manual",
          }],
        },
      },
      path: `/orders/${input.orderId}/refunds.json`,
    })
  }

  /**
   * Evaluate (and optionally execute) a percentage discount price rule.
   *
   * Action type: `shopify.discount`.
   *
   * @param input - Discount title, percent off, and optional dry-run override.
   * @returns Evaluation result and optional Admin API response.
   * @throws Error When Limetry evaluation fails or Admin API returns non-OK.
   */
  async createDiscount(input: {
    title: string
    percentOff: number
    dryRun?: boolean
  }): Promise<ShopifyMutationResult> {
    return this.mutate({
      actionType: "shopify.discount",
      resource: `shop:${this.shopDomain}/discounts/${encodeURIComponent(input.title)}`,
      dryRun: input.dryRun,
      body: {
        price_rule: {
          title: input.title,
          target_type: "line_item",
          target_selection: "all",
          allocation_method: "across",
          value_type: "percentage",
          value: `-${input.percentOff}`,
          customer_selection: "all",
          starts_at: new Date().toISOString(),
        },
      },
      path: "/price_rules.json",
    })
  }

  /**
   * Evaluate (and optionally execute) an inventory level set.
   *
   * Action type: `shopify.inventory`.
   *
   * @param input - Inventory item, location, available quantity, optional dry-run.
   * @returns Evaluation result and optional Admin API response.
   * @throws Error When Limetry evaluation fails or Admin API returns non-OK.
   */
  async updateInventory(input: {
    inventoryItemId: string
    locationId: string
    available: number
    dryRun?: boolean
  }): Promise<ShopifyMutationResult> {
    return this.mutate({
      actionType: "shopify.inventory",
      resource: `shop:${this.shopDomain}/inventory/${input.inventoryItemId}`,
      dryRun: input.dryRun,
      body: {
        location_id: input.locationId,
        inventory_item_id: input.inventoryItemId,
        available: input.available,
      },
      path: "/inventory_levels/set.json",
    })
  }

  /**
   * Shared evaluate-then-maybe-execute path for Admin mutations.
   *
   * Skips Admin API when decision is not `allow` or when dry-run is enabled.
   *
   * @param input - Action type, resource, path, body, and optional cost / dry-run.
   * @returns Mutation result with `executed` reflecting whether Admin API ran.
   * @throws Error When Limetry evaluation returns `ok: false`.
   */
  private async mutate(input: {
    actionType: string
    resource: string
    cost?: { amount_minor: number; currency: string }
    dryRun?: boolean
    path: string
    body: Record<string, unknown>
  }): Promise<ShopifyMutationResult> {
    const dryRun = input.dryRun ?? this.dryRunDefault
    const intent: ActionIntent = {
      intent_id: randomUUID(),
      policy_id: this.policyId,
      agent_id: this.agentId,
      action_type: input.actionType,
      resource: input.resource,
      cost: input.cost,
      metadata: {
        dry_run: String(dryRun),
        shop: this.shopDomain,
      },
      issued_at: new Date().toISOString(),
    }

    const evaluation = await this.engine.evaluateAction(intent)
    if (!evaluation.ok) {
      throw new Error(evaluation.error ?? "Limetry evaluate failed")
    }
    if (evaluation.decision !== "allow" || dryRun) {
      return {
        intent,
        evaluation,
        dryRun,
        executed: false,
      }
    }

    const response = await this.adminFetch(input.path, input.body)
    return {
      intent,
      evaluation,
      dryRun,
      executed: true,
      response,
    }
  }

  /**
   * POST JSON to the Shopify Admin REST API for this shop.
   *
   * @param path - Admin API path under `/admin/api/{version}`.
   * @param body - JSON request body.
   * @returns Parsed JSON response.
   * @throws Error When the Admin API responds with a non-OK status.
   */
  private async adminFetch(path: string, body: Record<string, unknown>): Promise<unknown> {
    const url = `https://${this.shopDomain}/admin/api/${this.apiVersion}${path}`
    const response = await this.fetcher(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.adminToken,
      },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const text = await response.text().catch(() => `HTTP ${response.status}`)
      throw new Error(`Shopify Admin API error (${response.status}): ${text}`)
    }
    return response.json()
  }
}
