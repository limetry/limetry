[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / createRemoteEngine

# Function: createRemoteEngine()

> **createRemoteEngine**(`overrides?`): [`RemotePolicyEngine`](../classes/RemotePolicyEngine.md)

Defined in: [engine/remote-engine.ts:137](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/engine/remote-engine.ts#L137)

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
