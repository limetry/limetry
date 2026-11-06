[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / scrubResource

# Function: scrubResource()

> **scrubResource**(`resource`): `string`

Defined in: [privacy/redact.ts:52](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/sdk/src/privacy/redact.ts#L52)

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
