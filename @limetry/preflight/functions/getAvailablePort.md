[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / getAvailablePort

# Function: getAvailablePort()

> **getAvailablePort**(`preferredPort`, `maxTries?`): `Promise`\<`number`\>

Defined in: [ports.ts:105](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/preflight/src/ports.ts#L105)

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
