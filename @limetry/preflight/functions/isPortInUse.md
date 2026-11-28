[**Limetry v1.2.106**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / isPortInUse

# Function: isPortInUse()

> **isPortInUse**(`port`): `Promise`\<`boolean`\>

Defined in: [ports.ts:79](https://github.com/limetry/limetry/blob/177ce0a005d959d4fe84246d6472f9dda4bb7e04/packages/preflight/src/ports.ts#L79)

Returns true when something is already bound to or accepting connections on the port.

## Parameters

### port

`number`

TCP port to inspect on loopback and default interfaces.

## Returns

`Promise`\<`boolean`\>

Whether the port appears occupied.
