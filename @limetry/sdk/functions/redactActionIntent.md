[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / redactActionIntent

# Function: redactActionIntent()

> **redactActionIntent**(`intent`): [`ActionIntent`](../type-aliases/ActionIntent.md)

Defined in: [privacy/redact.ts:188](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/privacy/redact.ts#L188)

Returns an [ActionIntent](../type-aliases/ActionIntent.md) safe to log or forward after secret scrubbing.

Resource query strings are removed; sensitive metadata keys are redacted.

## Parameters

### intent

[`ActionIntent`](../type-aliases/ActionIntent.md)

Original action intent.

## Returns

[`ActionIntent`](../type-aliases/ActionIntent.md)

Shallow copy with scrubbed `resource` and redacted `metadata`.
