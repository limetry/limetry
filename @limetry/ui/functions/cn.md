[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ui](../README.md) / cn

# Function: cn()

> **cn**(...`inputs`): `string`

Defined in: [lib/cn.ts:13](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/ui/src/lib/cn.ts#L13)

Merges conditional class names with Tailwind conflict resolution.

Combines `clsx` for conditional lists and `tailwind-merge` so later utilities
override earlier conflicting ones (for example `p-2` vs `p-4`).

## Parameters

### inputs

...`ClassValue`[]

Class values accepted by `clsx` (strings, arrays, objects).

## Returns

`string`

A single space-separated class string safe for NativeWind / Tailwind.
