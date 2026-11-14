[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / AuditMode

# Type Alias: AuditMode

> **AuditMode** = `"minimal"` \| `"forensics"`

Defined in: [privacy/redact.ts:15](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/privacy/redact.ts#L15)

Audit retention modes for ActionPolicy.
- minimal: store decision projection only (default)
- forensics: store redacted intent + details after secret scrubbing
