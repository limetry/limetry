[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/shopify](../README.md) / ShopifyMutationResult

# Type Alias: ShopifyMutationResult

> **ShopifyMutationResult** = `object`

Defined in: [client.ts:67](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/shopify/src/client.ts#L67)

Result of a governed Shopify mutation attempt.

## Properties

### dryRun

> **dryRun**: `boolean`

Defined in: [client.ts:79](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/shopify/src/client.ts#L79)

Whether this call ran in dry-run mode.

***

### evaluation

> **evaluation**: `OkActionEvaluation`

Defined in: [client.ts:75](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/shopify/src/client.ts#L75)

Successful remote evaluation response.

***

### executed

> **executed**: `boolean`

Defined in: [client.ts:83](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/shopify/src/client.ts#L83)

`true` only when decision was `allow` and dry-run was false, so Admin API ran.

***

### intent

> **intent**: [`ActionIntent`](../../sdk/type-aliases/ActionIntent.md)

Defined in: [client.ts:71](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/shopify/src/client.ts#L71)

ActionIntent submitted for evaluation.

***

### response?

> `optional` **response?**: `unknown`

Defined in: [client.ts:87](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/shopify/src/client.ts#L87)

Parsed Admin API JSON when `executed` is true.
