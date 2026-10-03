[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ui](../README.md) / isNavItemActive

# Function: isNavItemActive()

> **isNavItemActive**(`pathname`, `href`): `boolean`

Defined in: [navigation/types.ts:55](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/ui/src/navigation/types.ts#L55)

Returns true when pathname matches the item href or a nested child path.

Root (`"/"`) matches only the exact root path. Other targets match equality
or a prefix followed by `/`.

## Parameters

### pathname

`string`

Current location pathname.

### href

`string`

Nav item href to test.

## Returns

`boolean`

Whether the pathname is active for that href.
