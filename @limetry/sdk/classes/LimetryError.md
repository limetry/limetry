[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / LimetryError

# Class: LimetryError

Defined in: [errors.ts:14](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/sdk/src/errors.ts#L14)

Base error for Limetry SDK failures.

Subclasses set a specific `name` and `code`; callers should catch
`LimetryError` (or a subclass) rather than comparing message text.

## Extends

- `Error`

## Extended by

- [`EngineLoadError`](EngineLoadError.md)
- [`PaymentInterceptionError`](PaymentInterceptionError.md)
- [`PolicyViolationError`](PolicyViolationError.md)
- [`RateLimitExceededError`](RateLimitExceededError.md)

## Constructors

### Constructor

> **new LimetryError**(`code`, `message`): `LimetryError`

Defined in: [errors.ts:26](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/sdk/src/errors.ts#L26)

Creates a Limetry error with a stable code and human-readable message.

#### Parameters

##### code

`string`

Machine-readable error code.

##### message

`string`

Human-readable description.

#### Returns

`LimetryError`

#### Overrides

`Error.constructor`

## Properties

### code

> `readonly` **code**: `string`

Defined in: [errors.ts:18](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/sdk/src/errors.ts#L18)

Stable machine-readable error code (for example `policy_violation`).
