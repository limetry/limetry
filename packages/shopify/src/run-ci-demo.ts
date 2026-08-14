#!/usr/bin/env node
/**
 * Live CI demo entrypoint that dry-runs Shopify mutations through Limetry.
 *
 * Always sets `dryRun: true` so the Admin API is never called.
 */

import { ShopifyActionFirewall } from "./client.js"

/**
 * Demo mutation scenario selected via `INPUT_ACTION` / `LIMETRY_DEMO_ACTION`.
 */
export type ShopifyDemoAction = "refund" | "large_refund" | "inventory"

/**
 * Parse a demo action string; defaults to `refund`.
 *
 * @param value - Raw env value.
 * @returns Normalized demo action.
 */
function readDemoAction(value: string | undefined): ShopifyDemoAction {
  if (value === "large_refund" || value === "inventory") {
    return value
  }
  return "refund"
}

/**
 * Test overrides for {@link runShopifyCiDemo}.
 */
export type ShopifyCiDemoOverrides = {
  /**
   * Optional fetch used by the firewall / Limetry client.
   */
  fetch?: typeof fetch
}

/**
 * Evaluate a dry-run Shopify mutation against Limetry for the live CI demo.
 * Never calls Admin API. Returns 0 on allow and 1 on deny or transport failure.
 *
 * @param env - Process environment; defaults to `process.env`.
 * @param overrides - Optional fetch override for tests.
 * @returns Process exit code (`0` allow, `1` deny / missing inputs).
 * @throws Propagates unexpected evaluation errors to the direct-run handler.
 */
export async function runShopifyCiDemo(
  env: NodeJS.ProcessEnv = process.env,
  overrides: ShopifyCiDemoOverrides = {},
): Promise<number> {
  const apiKey = env.INPUT_LIMETRY_API_KEY ?? env.LIMETRY_API_KEY ?? ""
  const baseUrl = env.INPUT_LIMETRY_BASE_URL ?? env.LIMETRY_BASE_URL
  const policyId = env.INPUT_POLICY_ID ?? env.LIMETRY_POLICY_ID ?? ""
  const agentId = env.INPUT_AGENT_ID ?? "shopify_agent"
  const shopDomain = env.INPUT_SHOP_DOMAIN ?? "demo.myshopify.com"
  const demoAction = readDemoAction(env.INPUT_ACTION ?? env.LIMETRY_DEMO_ACTION)

  if (!apiKey || !policyId) {
    process.stderr.write("Missing required Shopify demo inputs (api key or policy id)\n")
    return 1
  }

  const firewall = new ShopifyActionFirewall({
    shopDomain,
    adminToken: env.SHOPIFY_ADMIN_TOKEN ?? "ci-unused-admin-token",
    apiKey,
    baseUrl,
    policyId,
    agentId,
    dryRun: true,
    fetch: overrides.fetch,
  })

  const result = demoAction === "inventory"
    ? await firewall.updateInventory({
      inventoryItemId: "gid://shopify/InventoryItem/1",
      locationId: "gid://shopify/Location/1",
      available: 0,
    })
    : await firewall.createRefund({
      orderId: "1001",
      amountMinor: demoAction === "large_refund" ? 50_000 : 1_000,
      currency: "USD",
    })

  const decision = result.evaluation.decision ?? "deny"
  process.stdout.write(
    `Limetry ${decision} for ${result.intent.action_type} ${result.intent.resource}` +
    ` (executed=${String(result.executed)}, dry_run=${String(result.dryRun)})\n`,
  )

  if (decision === "allow") {
    return 0
  }

  process.stderr.write(
    `Limetry denied ${result.intent.action_type}: ${(result.evaluation.reasons ?? []).join("; ")}\n`,
  )
  return 1
}

/**
 * True when this module is executed directly rather than imported.
 */
const isDirectRun =
  process.argv[1]?.endsWith("run-ci-demo.js") ||
  process.argv[1]?.endsWith("run-ci-demo.ts")

if (isDirectRun) {
  void runShopifyCiDemo()
    .then((code) => {
      process.exit(code)
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      process.stderr.write(`${message}\n`)
      process.exit(1)
    })
}
