[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / expandListenUrls

# Function: expandListenUrls()

> **expandListenUrls**(`url`): `string`[]

Defined in: [listen-urls.ts:68](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/preflight/src/listen-urls.ts#L68)

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
