[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ui](../README.md) / findActiveNavHref

# Function: findActiveNavHref()

> **findActiveNavHref**(`pathname`, `items`): `string` \| `null`

Defined in: [navigation/types.ts:86](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/ui/src/navigation/types.ts#L86)

Returns the href of the single most specific nav item for pathname (longest match;
deepest item wins ties). Used so only one drawer row gets active highlight.

## Parameters

### pathname

`string`

Current location pathname.

### items

[`NavItem`](../type-aliases/NavItem.md)[]

Top-level nav tree to search.

## Returns

`string` \| `null`

Winning item `href`, or `null` when nothing matches.
