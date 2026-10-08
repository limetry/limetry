[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / expandListenUrls

# Function: expandListenUrls()

> **expandListenUrls**(`url`): `string`[]

Defined in: [listen-urls.ts:68](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/listen-urls.ts#L68)

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
