[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ui](../README.md) / isHighlightedNavItem

# Function: isHighlightedNavItem()

> **isHighlightedNavItem**(`pathname`, `href`, `items`): `boolean`

Defined in: [navigation/types.ts:162](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/ui/src/navigation/types.ts#L162)

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
