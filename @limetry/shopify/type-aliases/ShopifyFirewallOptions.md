[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/shopify](../README.md) / ShopifyFirewallOptions

# Type Alias: ShopifyFirewallOptions

> **ShopifyFirewallOptions** = `object`

Defined in: [client.ts:21](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/shopify/src/client.ts#L21)

Construction options for [ShopifyActionFirewall](../classes/ShopifyActionFirewall.md).

## Properties

### adminToken

> **adminToken**: `string`

Defined in: [client.ts:29](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/shopify/src/client.ts#L29)

Shopify Admin API access token; never returned to callers.

***

### agentId?

> `optional` **agentId?**: `string`

Defined in: [client.ts:53](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/shopify/src/client.ts#L53)

Agent id recorded on intents; defaults to `shopify_agent`.

***

### apiKey

> **apiKey**: `string`

Defined in: [client.ts:37](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/shopify/src/client.ts#L37)

Limetry API key / bearer token.

***

### apiVersion?

> `optional` **apiVersion?**: `string`

Defined in: [client.ts:33](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/shopify/src/client.ts#L33)

Admin API version segment; defaults to `2025-01`.

***

### baseUrl?

> `optional` **baseUrl?**: `string`

Defined in: [client.ts:41](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/shopify/src/client.ts#L41)

Limetry API base URL.

***

### dryRun?

> `optional` **dryRun?**: `boolean`

Defined in: [client.ts:57](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/shopify/src/client.ts#L57)

Default dry-run mode; defaults to `true` (evaluate only, no Admin call).

***

### fetch?

> `optional` **fetch?**: *typeof* `globalThis.fetch`

Defined in: [client.ts:61](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/shopify/src/client.ts#L61)

Optional fetch implementation for tests.

***

### policyId

> **policyId**: `string`

Defined in: [client.ts:49](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/shopify/src/client.ts#L49)

ActionPolicy id used for every mutation intent.

***

### shopDomain

> **shopDomain**: `string`

Defined in: [client.ts:25](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/shopify/src/client.ts#L25)

Shop hostname (with or without `https://` prefix).

***

### tenantId?

> `optional` **tenantId?**: `string`

Defined in: [client.ts:45](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/shopify/src/client.ts#L45)

Tenant id for multi-tenant evaluation.
