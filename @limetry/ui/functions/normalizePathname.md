[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ui](../README.md) / normalizePathname

# Function: normalizePathname()

> **normalizePathname**(`pathname`): `string`

Defined in: [navigation/types.ts:40](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/ui/src/navigation/types.ts#L40)

Strips Expo / Next route-group segments like `/(app)` from a path.

## Parameters

### pathname

`string`

Raw router pathname that may include parenthesized groups.

## Returns

`string`

Normalized path beginning with `/`, or `"/"` when empty after stripping.
