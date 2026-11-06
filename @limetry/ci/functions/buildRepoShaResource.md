[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ci](../README.md) / buildRepoShaResource

# Function: buildRepoShaResource()

> **buildRepoShaResource**(`repository`, `sha`): `string`

Defined in: [intent.ts:64](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/ci/src/intent.ts#L64)

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
