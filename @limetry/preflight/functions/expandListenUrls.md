[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / expandListenUrls

# Function: expandListenUrls()

> **expandListenUrls**(`url`): `string`[]

Defined in: [listen-urls.ts:68](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/preflight/src/listen-urls.ts#L68)

Returns the single canonical listen URL.
Loopback hosts are normalized to `localhost` so 127.0.0.1 / ::1 / 0.0.0.0
do not print as separate synonyms, and LAN interfaces are not enumerated.

## Parameters

### url

`string`

Raw listen URL from the server or adapter.

## Returns

`string`[]

One-element array with the canonical URL, or `[url]` when unparsable.
