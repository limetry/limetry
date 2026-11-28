[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / resolveAppVersion

# Function: resolveAppVersion()

> **resolveAppVersion**(`env?`): [`AppVersionInfo`](../type-aliases/AppVersionInfo.md)

Defined in: [app-version.ts:169](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/sdk/src/app-version.ts#L169)

Resolves platform version + build/channel details for packages and footers.

## Parameters

### env?

`ProcessEnv` = `process.env`

Optional env bag (defaults to `process.env`).

## Returns

[`AppVersionInfo`](../type-aliases/AppVersionInfo.md)

Structured version info.
