[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / TransactionCategory

# Type Alias: TransactionCategory

> **TransactionCategory** = \{ `kind`: `"SoftwareSubscription"`; \} \| \{ `kind`: `"CloudInfrastructure"`; \} \| \{ `kind`: `"ProfessionalServices"`; \} \| \{ `kind`: `"Marketplace"`; \} \| \{ `kind`: `"Other"`; `label`: `string`; \}

Defined in: [types.ts:30](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/sdk/src/types.ts#L30)

Merchant / spend category discriminator for payment intents.

`Other` carries a free-form `label`; other kinds are fixed tags.
