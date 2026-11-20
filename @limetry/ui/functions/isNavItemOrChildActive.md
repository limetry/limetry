[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ui](../README.md) / isNavItemOrChildActive

# Function: isNavItemOrChildActive()

> **isNavItemOrChildActive**(`pathname`, `item`): `boolean`

Defined in: [navigation/types.ts:73](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/ui/src/navigation/types.ts#L73)

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
