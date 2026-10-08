[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / ChatCompletionClient

# Type Alias: ChatCompletionClient

> **ChatCompletionClient** = `object`

Defined in: [types.ts:721](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L721)

Narrow OpenAI-compatible client surface used to intercept payment tool calls.

## Properties

### chat

> **chat**: `object`

Defined in: [types.ts:725](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L725)

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
