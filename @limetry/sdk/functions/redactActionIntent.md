[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / redactActionIntent

# Function: redactActionIntent()

> **redactActionIntent**(`intent`): [`ActionIntent`](../type-aliases/ActionIntent.md)

Defined in: [privacy/redact.ts:188](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/privacy/redact.ts#L188)

Returns an [ActionIntent](../type-aliases/ActionIntent.md) safe to log or forward after secret scrubbing.

Resource query strings are removed; sensitive metadata keys are redacted.

## Parameters

### intent

[`ActionIntent`](../type-aliases/ActionIntent.md)

Original action intent.

## Returns

[`ActionIntent`](../type-aliases/ActionIntent.md)

Shallow copy with scrubbed `resource` and redacted `metadata`.
