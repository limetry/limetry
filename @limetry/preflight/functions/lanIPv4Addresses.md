[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / lanIPv4Addresses

# Function: lanIPv4Addresses()

> **lanIPv4Addresses**(`interfaces?`): `string`[]

Defined in: [listen-urls.ts:30](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/preflight/src/listen-urls.ts#L30)

Non-internal IPv4 addresses from the given (or OS) network interfaces.
Reserved for tooling; banner listen URLs no longer enumerate LAN.

## Parameters

### interfaces?

`Dict`\<`NetworkInterfaceInfo`[]\> = `...`

Interface map; defaults to `os.networkInterfaces()`.

## Returns

`string`[]

List of non-internal IPv4 address strings.
