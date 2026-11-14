[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / resolveDevListenPort

# Function: resolveDevListenPort()

> **resolveDevListenPort**(`preferredPort`, `options?`): `Promise`\<[`ResolvedPort`](../type-aliases/ResolvedPort.md)\>

Defined in: [ports.ts:167](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/preflight/src/ports.ts#L167)

In development, hop off an occupied preferred port. Otherwise return preferred unchanged.

## Parameters

### preferredPort

`number`

Configured listen port.

### options?

Hop behavior controls.

#### enabled?

`boolean`

#### maxTries?

`number`

## Returns

`Promise`\<[`ResolvedPort`](../type-aliases/ResolvedPort.md)\>

Resolved listen port metadata.

## Throws

Error When hopping is enabled and no free port is found.
