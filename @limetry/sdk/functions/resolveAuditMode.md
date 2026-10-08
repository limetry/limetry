[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / resolveAuditMode

# Function: resolveAuditMode()

> **resolveAuditMode**(`policy`, `envDefault?`): [`AuditMode`](../type-aliases/AuditMode.md)

Defined in: [privacy/redact.ts:393](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/privacy/redact.ts#L393)

Resolves audit mode from a policy document or environment default.

Prefers a valid `policy.audit_mode`, then a valid `envDefault`, otherwise
[DEFAULT\_AUDIT\_MODE](../variables/DEFAULT_AUDIT_MODE.md).

## Parameters

### policy

\{ `audit_mode?`: `string` \| `null`; \} \| `null` \| `undefined`

Policy-like object that may carry `audit_mode`, or nullish.

### envDefault?

`string` \| `null`

Optional environment default string.

## Returns

[`AuditMode`](../type-aliases/AuditMode.md)

Resolved [AuditMode](../type-aliases/AuditMode.md).
