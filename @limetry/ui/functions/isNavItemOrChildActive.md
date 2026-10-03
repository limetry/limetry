[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ui](../README.md) / isNavItemOrChildActive

# Function: isNavItemOrChildActive()

> **isNavItemOrChildActive**(`pathname`, `item`): `boolean`

Defined in: [navigation/types.ts:71](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/ui/src/navigation/types.ts#L71)

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
