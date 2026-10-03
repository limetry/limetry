[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / isPortInUse

# Function: isPortInUse()

> **isPortInUse**(`port`): `Promise`\<`boolean`\>

Defined in: [ports.ts:79](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/preflight/src/ports.ts#L79)

Returns true when something is already bound to or accepting connections on the port.

## Parameters

### port

`number`

TCP port to inspect on loopback and default interfaces.

## Returns

`Promise`\<`boolean`\>

Whether the port appears occupied.
