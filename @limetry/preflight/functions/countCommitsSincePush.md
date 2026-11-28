[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / countCommitsSincePush

# Function: countCommitsSincePush()

> **countCommitsSincePush**(`cwd`): `number`

Defined in: [dev-version.ts:29](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/preflight/src/dev-version.ts#L29)

Counts commits on HEAD that are not on the upstream / origin tip.

## Parameters

### cwd

`string`

Git working tree (usually the stack repo root).

## Returns

`number`

Non-negative ahead count, or `0` when git is unavailable.
