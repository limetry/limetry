[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / resolveAvailablePort

# Function: resolveAvailablePort()

> **resolveAvailablePort**(`preferredPort`, `maxTries?`): `Promise`\<[`ResolvedPort`](../type-aliases/ResolvedPort.md)\>

Defined in: [ports.ts:147](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/preflight/src/ports.ts#L147)

Resolves a listen port, hopping forward when the preferred port is occupied.

## Parameters

### preferredPort

`number`

First port to try.

### maxTries?

`number` = `DEFAULT_MAX_TRIES`

Maximum consecutive ports to probe (default 50).

## Returns

`Promise`\<[`ResolvedPort`](../type-aliases/ResolvedPort.md)\>

Preferred port, chosen port, and whether they differ.

## Throws

Error When [getAvailablePort](getAvailablePort.md) cannot find a free port.
