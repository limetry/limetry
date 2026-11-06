[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / createRemoteEngine

# Function: createRemoteEngine()

> **createRemoteEngine**(`overrides?`): [`RemotePolicyEngine`](../classes/RemotePolicyEngine.md)

Defined in: [engine/remote-engine.ts:137](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/sdk/src/engine/remote-engine.ts#L137)

Creates a [RemotePolicyEngine](../classes/RemotePolicyEngine.md) using config from the environment.

Resolves `apiKey` from `overrides.apiKey`, then `LIMETRY_API_KEY`, then
`LIMETRY_BEARER_TOKEN`. Resolves `baseUrl` from `overrides.baseUrl`, then
`LIMETRY_BASE_URL`, then the hosted default.

## Parameters

### overrides?

`Partial`\<[`RemotePolicyEngineOptions`](../type-aliases/RemotePolicyEngineOptions.md)\>

Optional partial options merged over environment defaults.

## Returns

[`RemotePolicyEngine`](../classes/RemotePolicyEngine.md)

Configured [RemotePolicyEngine](../classes/RemotePolicyEngine.md).

## Throws

[EngineLoadError](../classes/EngineLoadError.md) when no API key can be resolved.
