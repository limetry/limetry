[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ui](../README.md) / isNavItemActive

# Function: isNavItemActive()

> **isNavItemActive**(`pathname`, `href`): `boolean`

Defined in: [navigation/types.ts:57](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/ui/src/navigation/types.ts#L57)

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
