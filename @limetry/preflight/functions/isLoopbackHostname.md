[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / isLoopbackHostname

# Function: isLoopbackHostname()

> **isLoopbackHostname**(`hostname`): `boolean`

Defined in: [listen-urls.ts:14](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/listen-urls.ts#L14)

True for loopback hostnames commonly used in local listen URLs.

## Parameters

### hostname

`string`

Hostname portion of a listen URL.

## Returns

`boolean`

Whether the host should be treated as loopback.
