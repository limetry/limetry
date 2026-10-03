[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / RunPreflightOptions

# Type Alias: RunPreflightOptions

> **RunPreflightOptions** = `object`

Defined in: [run.ts:22](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/run.ts#L22)

Options for [runPreflight](../functions/runPreflight.md).

Pass product-validated checks via `envChecks` (built from a typed env object
at the adapter). Use `env` / `source` only as the injected ProcessEnv bag for
dotenv listing, fail-hard policy, and logger — not as a substitute for Zod.

## Properties

### appVersion?

> `optional` **appVersion?**: `string`

Defined in: [run.ts:26](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/run.ts#L26)

Optional app version string rendered in the banner when provided.

***

### configuration?

> `optional` **configuration?**: `string`[]

Defined in: [run.ts:31](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/run.ts#L31)

Extra context lines (NODE_ENV, ports, derived DB host) shown under Context.
Prefer putting pass/fail settings in `envChecks`.

***

### env?

> `optional` **env?**: `NodeJS.ProcessEnv`

Defined in: [run.ts:36](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/run.ts#L36)

Injected env bag merged over `process.env` for runtime flags and dotenv listing.
Prefer passing the same bag your adapter already used for Zod parse.

***

### envChecks?

> `optional` **envChecks?**: [`PreflightCheck`](PreflightCheck.md)[]

Defined in: [run.ts:40](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/run.ts#L40)

Product-built env/secret checks included in the banner and fail-hard evaluation.

***

### failHard?

> `optional` **failHard?**: `boolean`

Defined in: [run.ts:44](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/run.ts#L44)

Override fail-hard policy. Defaults to [shouldFailHard](../functions/shouldFailHard.md) for the env bag.

***

### listenUrl?

> `optional` **listenUrl?**: `string`

Defined in: [run.ts:48](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/run.ts#L48)

Listen URL expanded into banner “ready” lines via [expandListenUrls](../functions/expandListenUrls.md).

***

### logger?

> `optional` **logger?**: `Logger`

Defined in: [run.ts:52](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/run.ts#L52)

Optional Pino logger; defaults to [createPreflightLogger](../functions/createPreflightLogger.md) for `product`.

***

### probes?

> `optional` **probes?**: [`ConnectivityProbe`](ConnectivityProbe.md)[]

Defined in: [run.ts:56](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/run.ts#L56)

Connectivity probes run when probing is enabled for the env bag.

***

### product

> **product**: `string`

Defined in: [run.ts:60](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/run.ts#L60)

Product display name used in the banner title and logger name.

***

### skipConnectivity?

> `optional` **skipConnectivity?**: `boolean`

Defined in: [run.ts:64](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/run.ts#L64)

When true, skips all probes. Defaults to the inverse of [shouldProbeConnectivity](../functions/shouldProbeConnectivity.md).
