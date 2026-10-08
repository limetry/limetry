[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / ProbeResult

# Type Alias: ProbeResult

> **ProbeResult** = `object`

Defined in: [types.ts:74](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/types.ts#L74)

Result of a single probe attempt.

## Properties

### detail

> **detail**: `string`

Defined in: [types.ts:78](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/types.ts#L78)

Human-readable outcome including elapsed time and error context when failed.

***

### ok

> **ok**: `boolean`

Defined in: [types.ts:82](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/types.ts#L82)

Whether the probe succeeded.
