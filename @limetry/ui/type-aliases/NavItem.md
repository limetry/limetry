[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ui](../README.md) / NavItem

# Type Alias: NavItem

> **NavItem** = `object`

Defined in: [navigation/types.ts:11](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/ui/src/navigation/types.ts#L11)

A single navigable link, optionally nested under a section.

## Properties

### children?

> `optional` **children?**: `NavItem`[]

Defined in: [navigation/types.ts:31](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/ui/src/navigation/types.ts#L31)

Nested items (for example Docs sections). Drawers render an expand/collapse group.

***

### href

> **href**: `string`

Defined in: [navigation/types.ts:15](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/ui/src/navigation/types.ts#L15)

Destination path (may include route-group segments that are normalized away).

***

### icon?

> `optional` **icon?**: `string`

Defined in: [navigation/types.ts:23](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/ui/src/navigation/types.ts#L23)

Optional icon id consumed by drawer `renderIcon` callbacks.

***

### label

> **label**: `string`

Defined in: [navigation/types.ts:19](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/ui/src/navigation/types.ts#L19)

Human-readable label shown in drawers and tabs.

***

### mobileTab?

> `optional` **mobileTab?**: `boolean`

Defined in: [navigation/types.ts:27](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/ui/src/navigation/types.ts#L27)

When true, the item is eligible for mobile bottom-tab presentation.
