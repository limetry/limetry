[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / AuditMode

# Type Alias: AuditMode

> **AuditMode** = `"minimal"` \| `"forensics"`

Defined in: [privacy/redact.ts:15](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/sdk/src/privacy/redact.ts#L15)

Audit retention modes for ActionPolicy.
- minimal: store decision projection only (default)
- forensics: store redacted intent + details after secret scrubbing
