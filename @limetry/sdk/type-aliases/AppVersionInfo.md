[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / AppVersionInfo

# Type Alias: AppVersionInfo

> **AppVersionInfo** = `object`

Defined in: [app-version.ts:28](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/sdk/src/app-version.ts#L28)

## Properties

### build

> **build**: `number`

Defined in: [app-version.ts:32](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/sdk/src/app-version.ts#L32)

Monotonic deploy/release build counter from build-info.json.

***

### channel

> **channel**: [`AppVersionChannel`](AppVersionChannel.md)

Defined in: [app-version.ts:34](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/sdk/src/app-version.ts#L34)

`dev` while running locally; `release` in production/test/deploy.

***

### label

> **label**: `string`

Defined in: [app-version.ts:36](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/sdk/src/app-version.ts#L36)

Display label, e.g. `v1.2.94-12` or `v1.2.94-dev-3`.

***

### version

> **version**: `string`

Defined in: [app-version.ts:30](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/sdk/src/app-version.ts#L30)

Platform semver without a leading `v`.
