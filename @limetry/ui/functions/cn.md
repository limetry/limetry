[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ui](../README.md) / cn

# Function: cn()

> **cn**(...`inputs`): `string`

Defined in: [lib/cn.ts:13](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/ui/src/lib/cn.ts#L13)

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
