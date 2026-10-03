[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/shopify](../README.md) / ShopifyActionFirewall

# Class: ShopifyActionFirewall

Defined in: [client.ts:96](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/shopify/src/client.ts#L96)

Holds the Shopify Admin token and only mutates after Limetry `allow`.

Default `dryRun` is `true`: evaluation still runs, but Admin API is not called.
Execution requires `decision === "allow"` and `dryRun === false`.

## Constructors

### Constructor

> **new ShopifyActionFirewall**(`options`): `ShopifyActionFirewall`

Defined in: [client.ts:109](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/shopify/src/client.ts#L109)

#### Parameters

##### options

[`ShopifyFirewallOptions`](../type-aliases/ShopifyFirewallOptions.md)

Shop credentials, Limetry API settings, and dry-run default.

#### Returns

`ShopifyActionFirewall`

## Properties

### adminToken

> `private` `readonly` **adminToken**: `string`

Defined in: [client.ts:98](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/shopify/src/client.ts#L98)

***

### agentId

> `private` `readonly` **agentId**: `string`

Defined in: [client.ts:102](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/shopify/src/client.ts#L102)

***

### apiVersion

> `private` `readonly` **apiVersion**: `string`

Defined in: [client.ts:99](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/shopify/src/client.ts#L99)

***

### dryRunDefault

> `private` `readonly` **dryRunDefault**: `boolean`

Defined in: [client.ts:103](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/shopify/src/client.ts#L103)

***

### engine

> `private` `readonly` **engine**: [`RemotePolicyEngine`](../../sdk/classes/RemotePolicyEngine.md)

Defined in: [client.ts:100](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/shopify/src/client.ts#L100)

***

### fetcher

> `private` `readonly` **fetcher**: \{(`input`, `init?`): `Promise`\<`Response`\>; (`input`, `init?`): `Promise`\<`Response`\>; \}

Defined in: [client.ts:104](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/shopify/src/client.ts#L104)

#### Call Signature

> (`input`, `init?`): `Promise`\<`Response`\>

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/fetch)

##### Parameters

###### input

`URL` \| `RequestInfo`

###### init?

`RequestInit`

##### Returns

`Promise`\<`Response`\>

#### Call Signature

> (`input`, `init?`): `Promise`\<`Response`\>

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/fetch)

##### Parameters

###### input

`string` \| `URL` \| `Request`

###### init?

`RequestInit`

##### Returns

`Promise`\<`Response`\>

***

### policyId

> `private` `readonly` **policyId**: `string`

Defined in: [client.ts:101](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/shopify/src/client.ts#L101)

***

### shopDomain

> `private` `readonly` **shopDomain**: `string`

Defined in: [client.ts:97](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/shopify/src/client.ts#L97)

## Methods

### adminFetch()

> `private` **adminFetch**(`path`, `body`): `Promise`\<`unknown`\>

Defined in: [client.ts:290](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/shopify/src/client.ts#L290)

POST JSON to the Shopify Admin REST API for this shop.

#### Parameters

##### path

`string`

Admin API path under `/admin/api/{version}`.

##### body

`Record`\<`string`, `unknown`\>

JSON request body.

#### Returns

`Promise`\<`unknown`\>

Parsed JSON response.

#### Throws

Error When the Admin API responds with a non-OK status.

***

### createDiscount()

> **createDiscount**(`input`): `Promise`\<[`ShopifyMutationResult`](../type-aliases/ShopifyMutationResult.md)\>

Defined in: [client.ts:174](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/shopify/src/client.ts#L174)

Evaluate (and optionally execute) a percentage discount price rule.

Action type: `shopify.discount`.

#### Parameters

##### input

Discount title, percent off, and optional dry-run override.

###### dryRun?

`boolean`

###### percentOff

`number`

###### title

`string`

#### Returns

`Promise`\<[`ShopifyMutationResult`](../type-aliases/ShopifyMutationResult.md)\>

Evaluation result and optional Admin API response.

#### Throws

Error When Limetry evaluation fails or Admin API returns non-OK.

***

### createRefund()

> **createRefund**(`input`): `Promise`\<[`ShopifyMutationResult`](../type-aliases/ShopifyMutationResult.md)\>

Defined in: [client.ts:134](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/shopify/src/client.ts#L134)

Evaluate (and optionally execute) a refund against an order.

Action type: `shopify.refund`. Includes cost metadata in minor units.

#### Parameters

##### input

Order id, refund amount, optional currency and dry-run override.

###### amountMinor

`number`

###### currency?

`string`

###### dryRun?

`boolean`

###### orderId

`string`

#### Returns

`Promise`\<[`ShopifyMutationResult`](../type-aliases/ShopifyMutationResult.md)\>

Evaluation result and optional Admin API response.

#### Throws

Error When Limetry evaluation fails or Admin API returns non-OK.

***

### mutate()

> `private` **mutate**(`input`): `Promise`\<[`ShopifyMutationResult`](../type-aliases/ShopifyMutationResult.md)\>

Defined in: [client.ts:236](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/shopify/src/client.ts#L236)

Shared evaluate-then-maybe-execute path for Admin mutations.

Skips Admin API when decision is not `allow` or when dry-run is enabled.

#### Parameters

##### input

Action type, resource, path, body, and optional cost / dry-run.

###### actionType

`string`

###### body

`Record`\<`string`, `unknown`\>

###### cost?

\{ `amount_minor`: `number`; `currency`: `string`; \}

###### cost.amount_minor

`number`

###### cost.currency

`string`

###### dryRun?

`boolean`

###### path

`string`

###### resource

`string`

#### Returns

`Promise`\<[`ShopifyMutationResult`](../type-aliases/ShopifyMutationResult.md)\>

Mutation result with `executed` reflecting whether Admin API ran.

#### Throws

Error When Limetry evaluation returns `ok: false`.

***

### updateInventory()

> **updateInventory**(`input`): `Promise`\<[`ShopifyMutationResult`](../type-aliases/ShopifyMutationResult.md)\>

Defined in: [client.ts:208](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/shopify/src/client.ts#L208)

Evaluate (and optionally execute) an inventory level set.

Action type: `shopify.inventory`.

#### Parameters

##### input

Inventory item, location, available quantity, optional dry-run.

###### available

`number`

###### dryRun?

`boolean`

###### inventoryItemId

`string`

###### locationId

`string`

#### Returns

`Promise`\<[`ShopifyMutationResult`](../type-aliases/ShopifyMutationResult.md)\>

Evaluation result and optional Admin API response.

#### Throws

Error When Limetry evaluation fails or Admin API returns non-OK.
