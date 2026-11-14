[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / ChatCompletionClient

# Type Alias: ChatCompletionClient

> **ChatCompletionClient** = `object`

Defined in: [types.ts:721](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/types.ts#L721)

Narrow OpenAI-compatible client surface used to intercept payment tool calls.

## Properties

### chat

> **chat**: `object`

Defined in: [types.ts:725](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/types.ts#L725)

Chat API namespace.

#### completions

> **completions**: `object`

Completions API namespace.

##### completions.create

> **create**: (`request`) => `Promise`\<[`ChatCompletionResponse`](ChatCompletionResponse.md)\>

Creates a chat completion for the given request.

###### Parameters

###### request

[`ChatCompletionRequest`](ChatCompletionRequest.md)

Chat completion request payload.

###### Returns

`Promise`\<[`ChatCompletionResponse`](ChatCompletionResponse.md)\>

Promise resolving to the provider response.
