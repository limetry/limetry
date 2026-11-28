[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / maskSecret

# Function: maskSecret()

> **maskSecret**(`value`): `string`

Defined in: [mask.ts:18](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/preflight/src/mask.ts#L18)

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
