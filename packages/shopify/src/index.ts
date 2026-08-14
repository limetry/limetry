/**
 * Shopify Admin mutation firewall and policy templates (`\@limetry/shopify`).
 *
 * Evaluates refund, discount, and inventory ActionIntents before calling Admin API.
 * Default dry-run mode evaluates without executing.
 *
 * @packageDocumentation
 */

export {
  ShopifyActionFirewall,
  type ShopifyFirewallOptions,
  type ShopifyMutationResult,
} from "./client.js"
export { createShopifyActionPolicy } from "./templates.js"
