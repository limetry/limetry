[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ui](../README.md) / isHighlightedNavItem

# Function: isHighlightedNavItem()

> **isHighlightedNavItem**(`pathname`, `href`, `items`): `boolean`

Defined in: [navigation/types.ts:148](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/ui/src/navigation/types.ts#L148)

True when this href is the single highlighted drawer item for pathname.

## Parameters

### pathname

`string`

Current location pathname.

### href

`string`

Href to compare against the winning active item.

### items

[`NavItem`](../type-aliases/NavItem.md)[]

Top-level nav tree used to resolve the active href.

## Returns

`boolean`

Whether `href` equals the single highlighted nav href.
