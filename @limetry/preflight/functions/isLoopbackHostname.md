[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / isLoopbackHostname

# Function: isLoopbackHostname()

> **isLoopbackHostname**(`hostname`): `boolean`

Defined in: [listen-urls.ts:14](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/preflight/src/listen-urls.ts#L14)

True for loopback hostnames commonly used in local listen URLs.

## Parameters

### hostname

`string`

Hostname portion of a listen URL.

## Returns

`boolean`

Whether the host should be treated as loopback.
