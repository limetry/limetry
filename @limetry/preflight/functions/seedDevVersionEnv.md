[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / seedDevVersionEnv

# Function: seedDevVersionEnv()

> **seedDevVersionEnv**(`cwd`, `env?`): `number`

Defined in: [dev-version.ts:55](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/preflight/src/dev-version.ts#L55)

Writes `LIMETRY_DEV_COMMITS` (+ Next/Expo public mirrors) for local AppVersion.

No-ops in production/test so deploy builds keep `vA.B.C-X` from build-info.

## Parameters

### cwd

`string`

Git working tree used for the ahead count.

### env?

`ProcessEnv` = `process.env`

Env bag to mutate (defaults to `process.env`).

## Returns

`number`

The seeded commit count (0 when skipped).
