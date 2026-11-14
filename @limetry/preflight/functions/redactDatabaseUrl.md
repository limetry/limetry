[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / redactDatabaseUrl

# Function: redactDatabaseUrl()

> **redactDatabaseUrl**(`value`): `object`

Defined in: [mask.ts:40](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/preflight/src/mask.ts#L40)

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
