[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / createPreflightLogger

# Function: createPreflightLogger()

> **createPreflightLogger**(`product`, `source?`): `Logger`

Defined in: [logger.ts:54](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/preflight/src/logger.ts#L54)

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
