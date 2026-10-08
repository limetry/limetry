[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / projectIntentForAudit

# Function: projectIntentForAudit()

> **projectIntentForAudit**(`intent`, `mode?`): [`AuditIntentProjection`](../type-aliases/AuditIntentProjection.md)

Defined in: [privacy/redact.ts:243](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/privacy/redact.ts#L243)

Builds the intent payload stored in audit / authorization rows.

`minimal` drops metadata; `forensics` keeps redacted metadata.

## Parameters

### intent

[`ActionIntent`](../type-aliases/ActionIntent.md)

Original action intent.

### mode?

[`AuditMode`](../type-aliases/AuditMode.md) = `DEFAULT_AUDIT_MODE`

Audit retention mode; defaults to [DEFAULT\_AUDIT\_MODE](../variables/DEFAULT_AUDIT_MODE.md).

## Returns

[`AuditIntentProjection`](../type-aliases/AuditIntentProjection.md)

Projection suitable for persistence.
