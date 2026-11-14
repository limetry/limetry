[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / createPreflightLogger

# Function: createPreflightLogger()

> **createPreflightLogger**(`product`, `source?`): `Logger`

Defined in: [logger.ts:54](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/preflight/src/logger.ts#L54)

Pino logger for preflight banners. Disabled in test; JSON when production + non-TTY.

## Parameters

### product

`string`

Product display name used in logger `name` and `base.product`.

### source?

`ProcessEnv` = `process.env`

Injected env bag for `NODE_ENV` / `LOG_LEVEL` (not ambient re-reads).

## Returns

`Logger`

Configured Pino Logger, or a disabled logger in test env.
