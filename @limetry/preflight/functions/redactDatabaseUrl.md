[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / redactDatabaseUrl

# Function: redactDatabaseUrl()

> **redactDatabaseUrl**(`value`): `object`

Defined in: [mask.ts:40](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/mask.ts#L40)

Splits a Postgres URL into display, host endpoint, and database name (no password).

## Parameters

### value

`string`

Connection string to parse.

## Returns

`object`

Display path without credentials, host endpoint, and database name.
         Invalid URLs return `"(invalid)"` / `"(none)"` placeholders.

### display

> **display**: `string`

### endpoint

> **endpoint**: `string`

### name

> **name**: `string`
