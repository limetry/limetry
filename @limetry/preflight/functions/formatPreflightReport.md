[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / formatPreflightReport

# Function: formatPreflightReport()

> **formatPreflightReport**(`input`): `string`

Defined in: [format.ts:52](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/format.ts#L52)

Renders the human-readable preflight banner (stdout via the preflight logger).

Prefer `envChecks` + `connectivityChecks` + `contextLines` over deprecated
`configuration` / `connectivity` string lists so Required/Optional grouping works.

## Parameters

### input

Banner sections and overall pass/warn outcome.

#### appVersion?

`string`

#### configuration?

`string`[]

**Deprecated**

Prefer `envChecks` so Required/Optional grouping is automatic.
When `envChecks` is set, these lines render under Context.

#### connectivity?

`string`[]

**Deprecated**

Prefer `connectivityChecks`. Kept for older call sites.

#### connectivityChecks?

[`PreflightCheck`](../type-aliases/PreflightCheck.md)[]

#### contextLines?

`string`[]

#### envChecks?

[`PreflightCheck`](../type-aliases/PreflightCheck.md)[]

#### envFiles

`string`

#### listenUrls?

`string`[]

#### passed

`boolean`

#### product

`string`

#### warnings

`boolean`

## Returns

`string`

Multi-line banner string ready to log.
