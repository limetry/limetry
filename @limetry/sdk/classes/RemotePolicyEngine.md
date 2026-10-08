[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/sdk](../README.md) / RemotePolicyEngine

# Class: RemotePolicyEngine

Defined in: [engine/remote-engine.ts:75](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/engine/remote-engine.ts#L75)

Policy engine that delegates ActionIntent evaluation to a Limetry server over HTTPS.

## Constructors

### Constructor

> **new RemotePolicyEngine**(`options`): `RemotePolicyEngine`

Defined in: [engine/remote-engine.ts:90](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/engine/remote-engine.ts#L90)

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

Defined in: [engine/remote-engine.ts:77](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/engine/remote-engine.ts#L77)

***

### baseUrl

> `private` `readonly` **baseUrl**: `string`

Defined in: [engine/remote-engine.ts:76](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/engine/remote-engine.ts#L76)

***

### fetcher

> `private` `readonly` **fetcher**: \{(`input`, `init?`): `Promise`\<`Response`\>; (`input`, `init?`): `Promise`\<`Response`\>; \}

Defined in: [engine/remote-engine.ts:79](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/engine/remote-engine.ts#L79)

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

Defined in: [engine/remote-engine.ts:78](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/engine/remote-engine.ts#L78)

## Methods

### evaluateAction()

> **evaluateAction**(`intent`): `Promise`\<[`ActionEvaluationResponse`](../type-aliases/ActionEvaluationResponse.md)\>

Defined in: [engine/remote-engine.ts:111](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/sdk/src/engine/remote-engine.ts#L111)

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
