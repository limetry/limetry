[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / PaymentInterceptionError

# Class: PaymentInterceptionError

Defined in: [errors.ts:111](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/errors.ts#L111)

Raised when payment tool interception cannot proceed safely.

Uses the fixed code `payment_interception_error`.

## Extends

- [`LimetryError`](LimetryError.md)

## Constructors

### Constructor

> **new PaymentInterceptionError**(`message`): `PaymentInterceptionError`

Defined in: [errors.ts:117](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/errors.ts#L117)

Creates a payment-interception failure with the given message.

#### Parameters

##### message

`string`

Human-readable interception failure description.

#### Returns

`PaymentInterceptionError`

#### Overrides

[`LimetryError`](LimetryError.md).[`constructor`](LimetryError.md#constructor)

## Properties

### code

> `readonly` **code**: `string`

Defined in: [errors.ts:18](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/errors.ts#L18)

Stable machine-readable error code (for example `policy_violation`).

#### Inherited from

[`LimetryError`](LimetryError.md).[`code`](LimetryError.md#code)
