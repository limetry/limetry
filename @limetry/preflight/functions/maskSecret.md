[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / maskSecret

# Function: maskSecret()

> **maskSecret**(`value`): `string`

Defined in: [mask.ts:18](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/preflight/src/mask.ts#L18)

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
