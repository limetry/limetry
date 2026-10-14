[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ui](../README.md) / normalizePathname

# Function: normalizePathname()

> **normalizePathname**(`pathname`): `string`

Defined in: [navigation/types.ts:40](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/ui/src/navigation/types.ts#L40)

Strips Expo / Next route-group segments like `/(app)` from a path.

## Parameters

### pathname

`string`

Raw router pathname that may include parenthesized groups.

## Returns

`string`

Normalized path beginning with `/`, or `"/"` when empty after stripping.
