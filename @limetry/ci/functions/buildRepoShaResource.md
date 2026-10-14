[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ci](../README.md) / buildRepoShaResource

# Function: buildRepoShaResource()

> **buildRepoShaResource**(`repository`, `sha`): `string`

Defined in: [intent.ts:64](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/ci/src/intent.ts#L64)

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
