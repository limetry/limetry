[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / projectIntentForAudit

# Function: projectIntentForAudit()

> **projectIntentForAudit**(`intent`, `mode?`): [`AuditIntentProjection`](../type-aliases/AuditIntentProjection.md)

Defined in: [privacy/redact.ts:243](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/sdk/src/privacy/redact.ts#L243)

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
