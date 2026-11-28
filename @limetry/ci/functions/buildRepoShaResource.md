[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/ci](../README.md) / buildRepoShaResource

# Function: buildRepoShaResource()

> **buildRepoShaResource**(`repository`, `sha`): `string`

Defined in: [intent.ts:64](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/ci/src/intent.ts#L64)

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
