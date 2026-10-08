[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ui](../README.md) / isNavItemOrChildActive

# Function: isNavItemOrChildActive()

> **isNavItemOrChildActive**(`pathname`, `item`): `boolean`

Defined in: [navigation/types.ts:73](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/ui/src/navigation/types.ts#L73)

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
