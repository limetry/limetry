[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / isLoopbackHostname

# Function: isLoopbackHostname()

> **isLoopbackHostname**(`hostname`): `boolean`

Defined in: [listen-urls.ts:14](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/preflight/src/listen-urls.ts#L14)

True for loopback hostnames commonly used in local listen URLs.

## Parameters

### hostname

`string`

Hostname portion of a listen URL.

## Returns

`boolean`

Whether the host should be treated as loopback.
