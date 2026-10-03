[**Limetry v1.2.55**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / RemotePolicyEngine

# Class: RemotePolicyEngine

Defined in: [engine/remote-engine.ts:79](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/engine/remote-engine.ts#L79)

Policy engine that delegates ActionIntent evaluation to a Limetry server over HTTPS.

## Constructors

### Constructor

> **new RemotePolicyEngine**(`options`): `RemotePolicyEngine`

Defined in: [engine/remote-engine.ts:94](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/engine/remote-engine.ts#L94)

Creates a remote engine from explicit connection options.

Trailing slashes are stripped from `baseUrl`. `tenantId` defaults to
`"default"`. `fetch` defaults to `globalThis.fetch`.

#### Parameters

##### options

[`RemotePolicyEngineOptions`](../type-aliases/RemotePolicyEngineOptions.md)

Connection and auth options.

#### Returns

`RemotePolicyEngine`

#### Throws

[EngineLoadError](EngineLoadError.md) when no `fetch` implementation is available.

## Properties

### apiKey

> `private` `readonly` **apiKey**: `string`

Defined in: [engine/remote-engine.ts:81](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/engine/remote-engine.ts#L81)

***

### baseUrl

> `private` `readonly` **baseUrl**: `string`

Defined in: [engine/remote-engine.ts:80](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/engine/remote-engine.ts#L80)

***

### fetcher

> `private` `readonly` **fetcher**: \{(`input`, `init?`): `Promise`\<`Response`\>; (`input`, `init?`): `Promise`\<`Response`\>; \}

Defined in: [engine/remote-engine.ts:83](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/engine/remote-engine.ts#L83)

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

### tenantId

> `private` `readonly` **tenantId**: `string`

Defined in: [engine/remote-engine.ts:82](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/engine/remote-engine.ts#L82)

## Methods

### evaluateAction()

> **evaluateAction**(`intent`): `Promise`\<[`ActionEvaluationResponse`](../type-aliases/ActionEvaluationResponse.md)\>

Defined in: [engine/remote-engine.ts:115](https://github.com/limetry/limetry/blob/6484428901f65410d41ec354ae809991b9bcdeb6/packages/sdk/src/engine/remote-engine.ts#L115)

Evaluates an [ActionIntent](../type-aliases/ActionIntent.md) via `POST /v1/policy/evaluate`.

#### Parameters

##### intent

[`ActionIntent`](../type-aliases/ActionIntent.md)

Action intent to evaluate; `policy_id` is sent alongside the body.

#### Returns

`Promise`\<[`ActionEvaluationResponse`](../type-aliases/ActionEvaluationResponse.md)\>

Server [ActionEvaluationResponse](../type-aliases/ActionEvaluationResponse.md) (cast from JSON).

#### Throws

[EngineLoadError](EngineLoadError.md) when the HTTP call fails or returns a non-OK status.
