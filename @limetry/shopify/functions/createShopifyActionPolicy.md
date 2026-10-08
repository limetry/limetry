[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/shopify](../README.md) / createShopifyActionPolicy

# Function: createShopifyActionPolicy()

> **createShopifyActionPolicy**(`input`): [`ActionPolicy`](../../sdk/type-aliases/ActionPolicy.md)

Defined in: [templates.ts:16](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/shopify/src/templates.ts#L16)

Local policy template for Shopify mutation firewalls.

Allows `shopify.refund`, `shopify.discount`, and `shopify.inventory`.
Refunds require approval above a cost threshold; default max refund is 10000 minor units.

## Parameters

### input

Agent and organization ids plus optional refund / policy overrides.

#### agentId

`string`

#### maxRefundMinor?

`number`

#### organizationId?

`string`

#### policyId?

`string`

## Returns

[`ActionPolicy`](../../sdk/type-aliases/ActionPolicy.md)

A slim ActionPolicy suitable for local or remote registration.
