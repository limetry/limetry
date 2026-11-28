[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / AppVersionInfo

# Type Alias: AppVersionInfo

> **AppVersionInfo** = `object`

Defined in: [app-version.ts:32](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/sdk/src/app-version.ts#L32)

## Properties

### build

> **build**: `number`

Defined in: [app-version.ts:36](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/sdk/src/app-version.ts#L36)

Per-version deploy/release build counter from build-info.json.

***

### channel

> **channel**: [`AppVersionChannel`](AppVersionChannel.md)

Defined in: [app-version.ts:38](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/sdk/src/app-version.ts#L38)

`dev` while running locally; `release` in production/test/deploy.

***

### footerLabel

> **footerLabel**: `string`

Defined in: [app-version.ts:42](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/sdk/src/app-version.ts#L42)

Website footer label, e.g. `v1.2.94-12` or `v1.2.94-dev-3`.

***

### label

> **label**: `string`

Defined in: [app-version.ts:40](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/sdk/src/app-version.ts#L40)

Package/CLI/health label, e.g. `v1.2.94` or `v1.2.94-dev-3`.

***

### version

> **version**: `string`

Defined in: [app-version.ts:34](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/sdk/src/app-version.ts#L34)

Platform semver without a leading `v`.
