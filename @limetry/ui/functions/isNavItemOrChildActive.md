[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ui](../README.md) / isNavItemOrChildActive

# Function: isNavItemOrChildActive()

> **isNavItemOrChildActive**(`pathname`, `item`): `boolean`

Defined in: [navigation/types.ts:73](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/ui/src/navigation/types.ts#L73)

True when pathname matches this item or any descendant.

## Parameters

### pathname

`string`

Current location pathname.

### item

[`NavItem`](../type-aliases/NavItem.md)

Nav item that may contain nested `children`.

## Returns

`boolean`

Whether this item or a child is active for the pathname.
