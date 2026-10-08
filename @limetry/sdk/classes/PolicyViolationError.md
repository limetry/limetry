[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / PolicyViolationError

# Class: PolicyViolationError

Defined in: [errors.ts:39](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/errors.ts#L39)

Raised when policy evaluation rejects an intent.

The `code` is taken from `violation.code` when it is a string; otherwise
`"policy_violation"` is used.

## Extends

- [`LimetryError`](LimetryError.md)

## Constructors

### Constructor

> **new PolicyViolationError**(`violation`): `PolicyViolationError`

Defined in: [errors.ts:50](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/errors.ts#L50)

Creates a policy-violation error from an engine violation object.

#### Parameters

##### violation

`Record`\<`string`, `unknown`\>

Structured violation payload; `code` is preferred when a string.

#### Returns

`PolicyViolationError`

#### Overrides

[`LimetryError`](LimetryError.md).[`constructor`](LimetryError.md#constructor)

## Properties

### code

> `readonly` **code**: `string`

Defined in: [errors.ts:18](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/errors.ts#L18)

Stable machine-readable error code (for example `policy_violation`).

#### Inherited from

[`LimetryError`](LimetryError.md).[`code`](LimetryError.md#code)

***

### violation

> `readonly` **violation**: `Record`\<`string`, `unknown`\>

Defined in: [errors.ts:43](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/errors.ts#L43)

Structured violation payload returned by the evaluating engine.
