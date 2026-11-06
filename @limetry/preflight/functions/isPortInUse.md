[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / isPortInUse

# Function: isPortInUse()

> **isPortInUse**(`port`): `Promise`\<`boolean`\>

Defined in: [ports.ts:79](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/preflight/src/ports.ts#L79)

Returns true when something is already bound to or accepting connections on the port.

## Parameters

### port

`number`

TCP port to inspect on loopback and default interfaces.

## Returns

`Promise`\<`boolean`\>

Whether the port appears occupied.
