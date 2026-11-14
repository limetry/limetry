[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / lanIPv4Addresses

# Function: lanIPv4Addresses()

> **lanIPv4Addresses**(`interfaces?`): `string`[]

Defined in: [listen-urls.ts:30](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/preflight/src/listen-urls.ts#L30)

Non-internal IPv4 addresses from the given (or OS) network interfaces.
Reserved for tooling; banner listen URLs no longer enumerate LAN.

## Parameters

### interfaces?

`Dict`\<`NetworkInterfaceInfo`[]\> = `...`

Interface map; defaults to `os.networkInterfaces()`.

## Returns

`string`[]

List of non-internal IPv4 address strings.
