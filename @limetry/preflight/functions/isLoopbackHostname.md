[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / isLoopbackHostname

# Function: isLoopbackHostname()

> **isLoopbackHostname**(`hostname`): `boolean`

Defined in: [listen-urls.ts:14](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/listen-urls.ts#L14)

True for loopback hostnames commonly used in local listen URLs.

## Parameters

### hostname

`string`

Hostname portion of a listen URL.

## Returns

`boolean`

Whether the host should be treated as loopback.
