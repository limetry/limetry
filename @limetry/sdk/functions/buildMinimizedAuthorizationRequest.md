[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / buildMinimizedAuthorizationRequest

# Function: buildMinimizedAuthorizationRequest()

> **buildMinimizedAuthorizationRequest**(`input`): `Record`\<`string`, `unknown`\>

Defined in: [privacy/redact.ts:415](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/privacy/redact.ts#L415)

Builds a minimized authorization request projection for Cloud persistence.

Keeps a digest of the original intent; never stores raw secrets.

## Parameters

### input

Tenant/policy ids, intent, digest hex, and optional audit mode.

#### intent

[`ActionIntent`](../type-aliases/ActionIntent.md)

Intent to project into the request.

#### intentDigestHex

`string`

Hex digest of the original intent for correlation without storing secrets.

#### mode?

[`AuditMode`](../type-aliases/AuditMode.md)

Optional audit mode; defaults to [DEFAULT\_AUDIT\_MODE](../variables/DEFAULT_AUDIT_MODE.md).

#### policyId

`string`

Policy identifier.

#### tenantId

`string`

Tenant identifier.

## Returns

`Record`\<`string`, `unknown`\>

JSON-serializable authorization request projection.
