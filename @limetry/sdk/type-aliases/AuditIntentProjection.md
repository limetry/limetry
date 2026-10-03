[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / AuditIntentProjection

# Type Alias: AuditIntentProjection

> **AuditIntentProjection** = `object`

Defined in: [privacy/redact.ts:199](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/privacy/redact.ts#L199)

Intent fields retained in audit / authorization projections after scrubbing.

## Properties

### action\_type

> **action\_type**: `string`

Defined in: [privacy/redact.ts:215](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/privacy/redact.ts#L215)

Action type string.

***

### agent\_id

> **agent\_id**: `string`

Defined in: [privacy/redact.ts:211](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/privacy/redact.ts#L211)

Agent identifier.

***

### cost?

> `optional` **cost?**: [`ActionIntent`](ActionIntent.md)\[`"cost"`\]

Defined in: [privacy/redact.ts:223](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/privacy/redact.ts#L223)

Optional cost object (unchanged; not secret-scrubbed beyond intent redaction).

***

### intent\_id

> **intent\_id**: `string`

Defined in: [privacy/redact.ts:203](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/privacy/redact.ts#L203)

Intent identifier.

***

### issued\_at

> **issued\_at**: `string`

Defined in: [privacy/redact.ts:227](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/privacy/redact.ts#L227)

Issue timestamp (ISO-8601).

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `string`\>

Defined in: [privacy/redact.ts:231](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/privacy/redact.ts#L231)

Redacted metadata; present only in `forensics` mode projections.

***

### policy\_id

> **policy\_id**: `string`

Defined in: [privacy/redact.ts:207](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/privacy/redact.ts#L207)

Policy identifier.

***

### resource

> **resource**: `string`

Defined in: [privacy/redact.ts:219](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/privacy/redact.ts#L219)

Scrubbed resource identifier.
