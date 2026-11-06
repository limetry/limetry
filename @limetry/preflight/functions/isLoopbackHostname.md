[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / isLoopbackHostname

# Function: isLoopbackHostname()

> **isLoopbackHostname**(`hostname`): `boolean`

Defined in: [listen-urls.ts:14](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/preflight/src/listen-urls.ts#L14)

True for loopback hostnames commonly used in local listen URLs.

## Parameters

### hostname

`string`

Hostname portion of a listen URL.

## Returns

`boolean`

Whether the host should be treated as loopback.
