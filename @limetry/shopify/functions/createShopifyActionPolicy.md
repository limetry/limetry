[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/shopify](../README.md) / createShopifyActionPolicy

# Function: createShopifyActionPolicy()

> **createShopifyActionPolicy**(`input`): [`ActionPolicy`](../../sdk/type-aliases/ActionPolicy.md)

Defined in: [templates.ts:16](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/shopify/src/templates.ts#L16)

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
