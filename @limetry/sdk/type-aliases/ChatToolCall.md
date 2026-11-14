[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / ChatToolCall

# Type Alias: ChatToolCall

> **ChatToolCall** = `object`

Defined in: [types.ts:648](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/types.ts#L648)

OpenAI-style chat tool call attached to a completion message.

## Properties

### function

> **function**: `object`

Defined in: [types.ts:660](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/types.ts#L660)

Function name and JSON-encoded argument string.

#### arguments

> **arguments**: `string`

JSON string of function arguments.

#### name

> **name**: `string`

Registered tool / function name.

***

### id

> **id**: `string`

Defined in: [types.ts:652](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/types.ts#L652)

Tool call identifier.

***

### type

> **type**: `"function"`

Defined in: [types.ts:656](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/types.ts#L656)

Discriminator; currently always `"function"`.
