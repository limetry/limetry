[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / scrubResource

# Function: scrubResource()

> **scrubResource**(`resource`): `string`

Defined in: [privacy/redact.ts:52](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/sdk/src/privacy/redact.ts#L52)

Strips query string, hash, and URL userinfo from a resource identifier.

Non-URL resources are returned unchanged after trimming; if a `?` is present
on a non-URL string, only the prefix before the query is kept.

## Parameters

### resource

`string`

Resource identifier (URL or opaque string).

## Returns

`string`

Scrubbed resource string.
