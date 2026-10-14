[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / resolveAuditMode

# Function: resolveAuditMode()

> **resolveAuditMode**(`policy`, `envDefault?`): [`AuditMode`](../type-aliases/AuditMode.md)

Defined in: [privacy/redact.ts:393](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/sdk/src/privacy/redact.ts#L393)

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
