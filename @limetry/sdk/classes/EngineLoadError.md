[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / EngineLoadError

# Class: EngineLoadError

Defined in: [errors.ts:94](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/errors.ts#L94)

Raised when a remote or local policy engine fails to load or respond.

Uses the fixed code `engine_load_error`.

## Extends

- [`LimetryError`](LimetryError.md)

## Constructors

### Constructor

> **new EngineLoadError**(`message`): `EngineLoadError`

Defined in: [errors.ts:100](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/errors.ts#L100)

Creates an engine-load failure with the given message.

#### Parameters

##### message

`string`

Human-readable load or transport failure description.

#### Returns

`EngineLoadError`

#### Overrides

[`LimetryError`](LimetryError.md).[`constructor`](LimetryError.md#constructor)

## Properties

### code

> `readonly` **code**: `string`

Defined in: [errors.ts:18](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/errors.ts#L18)

Stable machine-readable error code (for example `policy_violation`).

#### Inherited from

[`LimetryError`](LimetryError.md).[`code`](LimetryError.md#code)
