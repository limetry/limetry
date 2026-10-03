[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / RateLimitExceededError

# Class: RateLimitExceededError

Defined in: [errors.ts:62](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/errors.ts#L62)

Raised when a client-side velocity circuit breaker blocks a transaction.

## Extends

- [`LimetryError`](LimetryError.md)

## Constructors

### Constructor

> **new RateLimitExceededError**(`cooldownPeriodMs`, `elapsedMs`): `RateLimitExceededError`

Defined in: [errors.ts:78](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/errors.ts#L78)

Creates a rate-limit error describing cooldown vs elapsed time.

#### Parameters

##### cooldownPeriodMs

`number`

Full cooldown window in milliseconds.

##### elapsedMs

`number`

Time already elapsed within the cooldown.

#### Returns

`RateLimitExceededError`

#### Overrides

[`LimetryError`](LimetryError.md).[`constructor`](LimetryError.md#constructor)

## Properties

### code

> `readonly` **code**: `string`

Defined in: [errors.ts:18](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/errors.ts#L18)

Stable machine-readable error code (for example `policy_violation`).

#### Inherited from

[`LimetryError`](LimetryError.md).[`code`](LimetryError.md#code)

***

### cooldownPeriodMs

> `readonly` **cooldownPeriodMs**: `number`

Defined in: [errors.ts:66](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/errors.ts#L66)

Configured cooldown window in milliseconds.

***

### elapsedMs

> `readonly` **elapsedMs**: `number`

Defined in: [errors.ts:70](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/errors.ts#L70)

Elapsed time since the breaker opened, in milliseconds.
