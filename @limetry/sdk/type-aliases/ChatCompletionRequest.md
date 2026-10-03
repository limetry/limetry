[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / ChatCompletionRequest

# Type Alias: ChatCompletionRequest

> **ChatCompletionRequest** = `object`

Defined in: [types.ts:675](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L675)

Minimal chat-completion request shape accepted by [ChatCompletionClient](ChatCompletionClient.md).

## Properties

### messages

> **messages**: `Record`\<`string`, `unknown`\>[]

Defined in: [types.ts:683](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L683)

Conversation messages (provider-specific message objects).

***

### model

> **model**: `string`

Defined in: [types.ts:679](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L679)

Model identifier passed to the upstream provider.

***

### tools?

> `optional` **tools?**: `Record`\<`string`, `unknown`\>[]

Defined in: [types.ts:687](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L687)

Optional tool definitions offered to the model.
