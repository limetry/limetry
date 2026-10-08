[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / resolveAvailablePort

# Function: resolveAvailablePort()

> **resolveAvailablePort**(`preferredPort`, `maxTries?`): `Promise`\<[`ResolvedPort`](../type-aliases/ResolvedPort.md)\>

Defined in: [ports.ts:147](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/ports.ts#L147)

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
