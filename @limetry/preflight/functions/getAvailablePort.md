[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / getAvailablePort

# Function: getAvailablePort()

> **getAvailablePort**(`preferredPort`, `maxTries?`): `Promise`\<`number`\>

Defined in: [ports.ts:105](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/preflight/src/ports.ts#L105)

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
