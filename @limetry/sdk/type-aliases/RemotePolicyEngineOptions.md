[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / RemotePolicyEngineOptions

# Type Alias: RemotePolicyEngineOptions

> **RemotePolicyEngineOptions** = `object`

Defined in: [engine/remote-engine.ts:17](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/engine/remote-engine.ts#L17)

Construction options for [RemotePolicyEngine](../classes/RemotePolicyEngine.md).

## Properties

### apiKey

> **apiKey**: `string`

Defined in: [engine/remote-engine.ts:27](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/engine/remote-engine.ts#L27)

API key (Bearer token). Generate one with `limetry setup` or from the portal.
For self-hosted servers this is your LIMETRY_BEARER_TOKEN value.

***

### baseUrl?

> `optional` **baseUrl?**: `string`

Defined in: [engine/remote-engine.ts:22](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/engine/remote-engine.ts#L22)

Base URL of the Limetry server.
Defaults to the hosted cloud API: https://api.limetry.com

***

### fetch?

> `optional` **fetch?**: *typeof* `globalThis.fetch`

Defined in: [engine/remote-engine.ts:35](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/engine/remote-engine.ts#L35)

Optional fetch override for test mocking or custom transports.

***

### tenantId?

> `optional` **tenantId?**: `string`

Defined in: [engine/remote-engine.ts:31](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/engine/remote-engine.ts#L31)

Tenant id for server-authoritative policy evaluation.
