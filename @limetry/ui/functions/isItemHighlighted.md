[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ui](../README.md) / isItemHighlighted

# Function: isItemHighlighted()

> **isItemHighlighted**(`pathname`, `item`, `activeHref`): `boolean`

Defined in: [navigation/types.ts:121](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/ui/src/navigation/types.ts#L121)

True when this specific NavItem is the single active highlighted leaf/target for pathname.
If this item is a section/folder container and has an active child, it returns false so
only the specific child page gets the active highlight.

## Parameters

### pathname

`string`

Current location pathname.

### item

[`NavItem`](../type-aliases/NavItem.md)

Candidate nav item.

### activeHref

`string` \| `null`

Result of [findActiveNavHref](findActiveNavHref.md), or `null` when none.

## Returns

`boolean`

Whether this item alone should receive the active highlight styles.
