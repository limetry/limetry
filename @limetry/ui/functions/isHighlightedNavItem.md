[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ui](../README.md) / isHighlightedNavItem

# Function: isHighlightedNavItem()

> **isHighlightedNavItem**(`pathname`, `href`, `items`): `boolean`

Defined in: [navigation/types.ts:162](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/ui/src/navigation/types.ts#L162)

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
