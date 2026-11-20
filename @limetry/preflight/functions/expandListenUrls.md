[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / expandListenUrls

# Function: expandListenUrls()

> **expandListenUrls**(`url`): `string`[]

Defined in: [listen-urls.ts:68](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/preflight/src/listen-urls.ts#L68)

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
