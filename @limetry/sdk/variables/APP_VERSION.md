[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / APP\_VERSION

# ~~Variable: APP\_VERSION~~

> `const` **APP\_VERSION**: `string` = `packageJson.version`

Defined in: [app-version.ts:28](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/sdk/src/app-version.ts#L28)

Bare product semver from package.json (e.g. `1.2.92`).

Kept for published `@limetry/cli` / `@limetry/mcp` builds that still import
`APP_VERSION`. Prefer [AppVersion](../functions/AppVersion.md) in new code.

## Deprecated

Use [AppVersion](../functions/AppVersion.md) (`v`-prefixed label) instead.
