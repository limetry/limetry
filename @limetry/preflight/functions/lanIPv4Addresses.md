[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / lanIPv4Addresses

# Function: lanIPv4Addresses()

> **lanIPv4Addresses**(`interfaces?`): `string`[]

Defined in: [listen-urls.ts:30](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/preflight/src/listen-urls.ts#L30)

Non-internal IPv4 addresses from the given (or OS) network interfaces.
Reserved for tooling; banner listen URLs no longer enumerate LAN.

## Parameters

### interfaces?

`Dict`\<`NetworkInterfaceInfo`[]\> = `...`

Interface map; defaults to `os.networkInterfaces()`.

## Returns

`string`[]

List of non-internal IPv4 address strings.
