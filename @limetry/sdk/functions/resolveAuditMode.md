[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / resolveAuditMode

# Function: resolveAuditMode()

> **resolveAuditMode**(`policy`, `envDefault?`): [`AuditMode`](../type-aliases/AuditMode.md)

Defined in: [privacy/redact.ts:393](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/privacy/redact.ts#L393)

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
