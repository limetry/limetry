[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ui](../README.md) / isItemHighlighted

# Function: isItemHighlighted()

> **isItemHighlighted**(`pathname`, `item`, `activeHref`): `boolean`

Defined in: [navigation/types.ts:133](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/ui/src/navigation/types.ts#L133)

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
