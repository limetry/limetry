[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / createPreflightLogger

# Function: createPreflightLogger()

> **createPreflightLogger**(`product`, `source?`): `Logger`

Defined in: [logger.ts:54](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/preflight/src/logger.ts#L54)

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
