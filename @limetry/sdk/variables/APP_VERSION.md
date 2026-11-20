[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / APP\_VERSION

# ~~Variable: APP\_VERSION~~

> `const` **APP\_VERSION**: `string` = `packageJson.version`

Defined in: [app-version.ts:24](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/sdk/src/app-version.ts#L24)

Bare product semver from package.json (e.g. `1.2.92`).

Kept for published `@limetry/cli` / `@limetry/mcp` builds that still import
`APP_VERSION`. Prefer [AppVersion](../functions/AppVersion.md) in new code.

## Deprecated

Use [AppVersion](../functions/AppVersion.md) (`v`-prefixed label) instead.
