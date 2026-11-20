[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ci](../README.md) / buildRepoShaResource

# Function: buildRepoShaResource()

> **buildRepoShaResource**(`repository`, `sha`): `string`

Defined in: [intent.ts:64](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/ci/src/intent.ts#L64)

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
