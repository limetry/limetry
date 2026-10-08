[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / getAvailablePort

# Function: getAvailablePort()

> **getAvailablePort**(`preferredPort`, `maxTries?`): `Promise`\<`number`\>

Defined in: [ports.ts:105](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/ports.ts#L105)

Finds the first available port starting from a preferred value.

## Parameters

### preferredPort

`number`

First port to try.

### maxTries?

`number` = `DEFAULT_MAX_TRIES`

Maximum consecutive ports to probe (default 50).

## Returns

`Promise`\<`number`\>

The first free port in `[preferredPort, preferredPort + maxTries)`.

## Throws

Error When no free port is found within `maxTries`.
