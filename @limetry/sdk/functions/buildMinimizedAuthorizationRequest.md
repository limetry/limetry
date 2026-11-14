[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / buildMinimizedAuthorizationRequest

# Function: buildMinimizedAuthorizationRequest()

> **buildMinimizedAuthorizationRequest**(`input`): `Record`\<`string`, `unknown`\>

Defined in: [privacy/redact.ts:415](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/privacy/redact.ts#L415)

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
