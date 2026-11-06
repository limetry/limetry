[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / RemotePolicyEngineOptions

# Type Alias: RemotePolicyEngineOptions

> **RemotePolicyEngineOptions** = `object`

Defined in: [engine/remote-engine.ts:18](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/sdk/src/engine/remote-engine.ts#L18)

Construction options for [RemotePolicyEngine](../classes/RemotePolicyEngine.md).

## Properties

### apiKey

> **apiKey**: `string`

Defined in: [engine/remote-engine.ts:28](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/sdk/src/engine/remote-engine.ts#L28)

API key (Bearer token). Generate one with `limetry setup` or from the portal.
For self-hosted servers this is your LIMETRY_BEARER_TOKEN value.

***

### baseUrl?

> `optional` **baseUrl?**: `string`

Defined in: [engine/remote-engine.ts:23](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/sdk/src/engine/remote-engine.ts#L23)

Base URL of the Limetry server.
Defaults to the production OSS API: https://api.limetry.org

***

### fetch?

> `optional` **fetch?**: *typeof* `globalThis.fetch`

Defined in: [engine/remote-engine.ts:36](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/sdk/src/engine/remote-engine.ts#L36)

Optional fetch override for test mocking or custom transports.

***

### tenantId?

> `optional` **tenantId?**: `string`

Defined in: [engine/remote-engine.ts:32](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/sdk/src/engine/remote-engine.ts#L32)

Tenant id for server-authoritative policy evaluation.
