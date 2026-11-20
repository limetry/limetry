[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / TransactionCategory

# Type Alias: TransactionCategory

> **TransactionCategory** = \{ `kind`: `"SoftwareSubscription"`; \} \| \{ `kind`: `"CloudInfrastructure"`; \} \| \{ `kind`: `"ProfessionalServices"`; \} \| \{ `kind`: `"Marketplace"`; \} \| \{ `kind`: `"Other"`; `label`: `string`; \}

Defined in: [types.ts:30](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/sdk/src/types.ts#L30)

Merchant / spend category discriminator for payment intents.

`Other` carries a free-form `label`; other kinds are fixed tags.
