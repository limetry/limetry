[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / resolveAppVersion

# Function: resolveAppVersion()

> **resolveAppVersion**(`env?`): [`AppVersionInfo`](../type-aliases/AppVersionInfo.md)

Defined in: [app-version.ts:105](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/sdk/src/app-version.ts#L105)

Resolves platform version + build/channel details for footers and health.

## Parameters

### env?

`ProcessEnv` = `process.env`

Optional env bag (defaults to `process.env`).

## Returns

[`AppVersionInfo`](../type-aliases/AppVersionInfo.md)

Structured version info.
