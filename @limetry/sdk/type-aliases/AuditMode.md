[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / AuditMode

# Type Alias: AuditMode

> **AuditMode** = `"minimal"` \| `"forensics"`

Defined in: [privacy/redact.ts:15](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/sdk/src/privacy/redact.ts#L15)

Audit retention modes for ActionPolicy.
- minimal: store decision projection only (default)
- forensics: store redacted intent + details after secret scrubbing
