[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ci](../README.md) / buildRepoShaResource

# Function: buildRepoShaResource()

> **buildRepoShaResource**(`repository`, `sha`): `string`

Defined in: [intent.ts:64](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/ci/src/intent.ts#L64)

Bind a repository and commit SHA into the ActionIntent resource field.

## Parameters

### repository

`string`

GitHub `owner/repo` string.

### sha

`string`

Commit SHA being gated.

## Returns

`string`

Resource string in the form `repository@sha`.
