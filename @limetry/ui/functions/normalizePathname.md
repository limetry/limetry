[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ui](../README.md) / normalizePathname

# Function: normalizePathname()

> **normalizePathname**(`pathname`): `string`

Defined in: [navigation/types.ts:40](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/ui/src/navigation/types.ts#L40)

Strips Expo / Next route-group segments like `/(app)` from a path.

## Parameters

### pathname

`string`

Raw router pathname that may include parenthesized groups.

## Returns

`string`

Normalized path beginning with `/`, or `"/"` when empty after stripping.
