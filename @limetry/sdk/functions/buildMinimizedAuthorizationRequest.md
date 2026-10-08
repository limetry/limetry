[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / buildMinimizedAuthorizationRequest

# Function: buildMinimizedAuthorizationRequest()

> **buildMinimizedAuthorizationRequest**(`input`): `Record`\<`string`, `unknown`\>

Defined in: [privacy/redact.ts:415](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/privacy/redact.ts#L415)

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
