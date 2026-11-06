[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / getAvailablePort

# Function: getAvailablePort()

> **getAvailablePort**(`preferredPort`, `maxTries?`): `Promise`\<`number`\>

Defined in: [ports.ts:105](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/preflight/src/ports.ts#L105)

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
