[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / redactDatabaseUrl

# Function: redactDatabaseUrl()

> **redactDatabaseUrl**(`value`): `object`

Defined in: [mask.ts:40](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/mask.ts#L40)

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
