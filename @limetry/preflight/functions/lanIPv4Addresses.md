[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / lanIPv4Addresses

# Function: lanIPv4Addresses()

> **lanIPv4Addresses**(`interfaces?`): `string`[]

Defined in: [listen-urls.ts:30](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/preflight/src/listen-urls.ts#L30)

Non-internal IPv4 addresses from the given (or OS) network interfaces.
Reserved for tooling; banner listen URLs no longer enumerate LAN.

## Parameters

### interfaces?

`Dict`\<`NetworkInterfaceInfo`[]\> = `...`

Interface map; defaults to `os.networkInterfaces()`.

## Returns

`string`[]

List of non-internal IPv4 address strings.
