[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ui](../README.md) / isNavItemActive

# Function: isNavItemActive()

> **isNavItemActive**(`pathname`, `href`): `boolean`

Defined in: [navigation/types.ts:57](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/ui/src/navigation/types.ts#L57)

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
