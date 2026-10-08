[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / ChatCompletionResponse

# Type Alias: ChatCompletionResponse

> **ChatCompletionResponse** = `object`

Defined in: [types.ts:693](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L693)

Minimal chat-completion response shape returned by [ChatCompletionClient](ChatCompletionClient.md).

## Properties

### choices

> **choices**: `object`[]

Defined in: [types.ts:697](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L697)

Completion choices; Limetry adapters read the first message's tool calls.

#### message

> **message**: `object`

Assistant message for this choice.

##### message.content

> **content**: `string` \| `null`

Text content, or `null` when only tool calls are present.

##### message.role

> **role**: `string`

Message role (typically `"assistant"`).

##### message.tool\_calls?

> `optional` **tool\_calls?**: [`ChatToolCall`](ChatToolCall.md)[]

Optional tool calls requested by the model.
