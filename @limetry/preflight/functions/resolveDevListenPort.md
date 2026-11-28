[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / resolveDevListenPort

# Function: resolveDevListenPort()

> **resolveDevListenPort**(`preferredPort`, `options?`): `Promise`\<[`ResolvedPort`](../type-aliases/ResolvedPort.md)\>

Defined in: [ports.ts:167](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/preflight/src/ports.ts#L167)

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
