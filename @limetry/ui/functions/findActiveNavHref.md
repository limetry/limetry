[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ui](../README.md) / findActiveNavHref

# Function: findActiveNavHref()

> **findActiveNavHref**(`pathname`, `items`): `string` \| `null`

Defined in: [navigation/types.ts:88](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/ui/src/navigation/types.ts#L88)

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
