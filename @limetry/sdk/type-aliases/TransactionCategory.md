[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / TransactionCategory

# Type Alias: TransactionCategory

> **TransactionCategory** = \{ `kind`: `"SoftwareSubscription"`; \} \| \{ `kind`: `"CloudInfrastructure"`; \} \| \{ `kind`: `"ProfessionalServices"`; \} \| \{ `kind`: `"Marketplace"`; \} \| \{ `kind`: `"Other"`; `label`: `string`; \}

Defined in: [types.ts:30](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/types.ts#L30)

Merchant / spend category discriminator for payment intents.

`Other` carries a free-form `label`; other kinds are fixed tags.
