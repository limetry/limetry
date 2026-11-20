[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / countCommitsSincePush

# Function: countCommitsSincePush()

> **countCommitsSincePush**(`cwd`): `number`

Defined in: [dev-version.ts:21](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/preflight/src/dev-version.ts#L21)

Counts commits on HEAD that are not on the upstream / origin tip.

## Parameters

### cwd

`string`

Git working tree (usually the stack repo root).

## Returns

`number`

Non-negative ahead count, or `0` when git is unavailable.
