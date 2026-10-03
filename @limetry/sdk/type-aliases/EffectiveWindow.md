[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / EffectiveWindow

# Type Alias: EffectiveWindow

> **EffectiveWindow** = `object`

Defined in: [types.ts:146](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L146)

Inclusive start and optional end of a policy's effective period (ISO-8601).

## Properties

### effective\_from

> **effective\_from**: `string`

Defined in: [types.ts:150](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L150)

Instant from which the policy is effective.

***

### expires\_at

> **expires\_at**: `string` \| `null`

Defined in: [types.ts:154](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/types.ts#L154)

Instant at which the policy stops being effective, or `null` if open-ended.
