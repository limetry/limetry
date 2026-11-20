[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / isPortInUse

# Function: isPortInUse()

> **isPortInUse**(`port`): `Promise`\<`boolean`\>

Defined in: [ports.ts:79](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/preflight/src/ports.ts#L79)

Returns true when something is already bound to or accepting connections on the port.

## Parameters

### port

`number`

TCP port to inspect on loopback and default interfaces.

## Returns

`Promise`\<`boolean`\>

Whether the port appears occupied.
