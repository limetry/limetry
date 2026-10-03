[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / ResolvedPort

# Type Alias: ResolvedPort

> **ResolvedPort** = `object`

Defined in: [ports.ts:124](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/ports.ts#L124)

Result of resolving a listen port against occupancy.

## Properties

### changed

> **changed**: `boolean`

Defined in: [ports.ts:136](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/ports.ts#L136)

`true` when `port` differs from `preferred`.

***

### port

> **port**: `number`

Defined in: [ports.ts:132](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/ports.ts#L132)

Port that should be used for listening.

***

### preferred

> **preferred**: `number`

Defined in: [ports.ts:128](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/ports.ts#L128)

Port originally requested by the caller.
