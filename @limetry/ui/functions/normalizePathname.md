[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ui](../README.md) / normalizePathname

# Function: normalizePathname()

> **normalizePathname**(`pathname`): `string`

Defined in: [navigation/types.ts:40](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/ui/src/navigation/types.ts#L40)

Strips Expo / Next route-group segments like `/(app)` from a path.

## Parameters

### pathname

`string`

Raw router pathname that may include parenthesized groups.

## Returns

`string`

Normalized path beginning with `/`, or `"/"` when empty after stripping.
