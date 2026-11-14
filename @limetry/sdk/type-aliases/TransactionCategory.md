[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / TransactionCategory

# Type Alias: TransactionCategory

> **TransactionCategory** = \{ `kind`: `"SoftwareSubscription"`; \} \| \{ `kind`: `"CloudInfrastructure"`; \} \| \{ `kind`: `"ProfessionalServices"`; \} \| \{ `kind`: `"Marketplace"`; \} \| \{ `kind`: `"Other"`; `label`: `string`; \}

Defined in: [types.ts:30](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/sdk/src/types.ts#L30)

Merchant / spend category discriminator for payment intents.

`Other` carries a free-form `label`; other kinds are fixed tags.
