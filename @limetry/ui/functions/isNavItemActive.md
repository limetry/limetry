[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ui](../README.md) / isNavItemActive

# Function: isNavItemActive()

> **isNavItemActive**(`pathname`, `href`): `boolean`

Defined in: [navigation/types.ts:57](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/ui/src/navigation/types.ts#L57)

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
