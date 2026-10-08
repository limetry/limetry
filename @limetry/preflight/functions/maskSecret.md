[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / maskSecret

# Function: maskSecret()

> **maskSecret**(`value`): `string`

Defined in: [mask.ts:18](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/mask.ts#L18)

Masks API keys / webhook secrets for banner display.

Recognizes Stripe-style prefixes and generic `sk-` keys; otherwise returns a
full mask. Unset values render as `"(unset)"`.

## Parameters

### value

`string` \| `undefined`

Raw secret string, or undefined when unset.

## Returns

`string`

Masked display string safe for logs and banners.
