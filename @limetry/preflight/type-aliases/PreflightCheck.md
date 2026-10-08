[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / PreflightCheck

# Type Alias: PreflightCheck

> **PreflightCheck** = `object`

Defined in: [types.ts:18](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/types.ts#L18)

One row in the preflight banner (env, secret, or connectivity).

Severity:
- optional (`required: false`): warn only
- required: must be healthy for full features; does not abort unless critical
- critical: abort startup when `failHard` (defaults to true when `required` is true)

## Properties

### critical?

> `optional` **critical?**: `boolean`

Defined in: [types.ts:23](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/types.ts#L23)

When `required` is true, defaults to `true` (hard-fail). Set `false` for
degraded-but-bootable dependencies (billing, secondary upstreams, etc.).

***

### detail

> **detail**: `string`

Defined in: [types.ts:27](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/types.ts#L27)

Human-readable status text shown after the check name in the banner.

***

### kind?

> `optional` **kind?**: [`PreflightCheckKind`](PreflightCheckKind.md)

Defined in: [types.ts:31](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/types.ts#L31)

Row kind for formatting; connectivity probes set this to `"connectivity"`.

***

### name

> **name**: `string`

Defined in: [types.ts:35](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/types.ts#L35)

Stable identifier for logging and failure summaries.

***

### ok

> **ok**: `boolean`

Defined in: [types.ts:39](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/types.ts#L39)

Whether the check or probe succeeded.

***

### required

> **required**: `boolean`

Defined in: [types.ts:43](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/types.ts#L43)

When false, failures are warnings only and never block startup.
