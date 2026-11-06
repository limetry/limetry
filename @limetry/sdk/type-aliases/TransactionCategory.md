[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / TransactionCategory

# Type Alias: TransactionCategory

> **TransactionCategory** = \{ `kind`: `"SoftwareSubscription"`; \} \| \{ `kind`: `"CloudInfrastructure"`; \} \| \{ `kind`: `"ProfessionalServices"`; \} \| \{ `kind`: `"Marketplace"`; \} \| \{ `kind`: `"Other"`; `label`: `string`; \}

Defined in: [types.ts:30](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/sdk/src/types.ts#L30)

Merchant / spend category discriminator for payment intents.

`Other` carries a free-form `label`; other kinds are fixed tags.
