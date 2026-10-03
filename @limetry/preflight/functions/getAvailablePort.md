[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / getAvailablePort

# Function: getAvailablePort()

> **getAvailablePort**(`preferredPort`, `maxTries?`): `Promise`\<`number`\>

Defined in: [ports.ts:105](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/ports.ts#L105)

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
