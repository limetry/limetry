# `@limetry/sdk`

TypeScript SDK for Limetry agent action governance. Evaluate an action before it runs, then record a privacy-safe audit of what happened.

## Install

```bash
npm install @limetry/sdk
```

This installs the published package, so `npm install`, `yarn add`, and
`pnpm add` are equivalent. For a cloned Limetry repository, use the root Yarn
Berry workspace instructions.

Requires Node.js 20 or newer.

## Evaluate an action

`LIMETRY_API_KEY` is a bearer token from `limetry setup` or your organization. `LIMETRY_BASE_URL` overrides the default API origin.

```ts
import { createRemoteEngine } from "@limetry/sdk"

const engine = createRemoteEngine()

const result = await engine.evaluateAction({
  intent_id: "11111111-1111-4111-8111-111111111111",
  policy_id: "22222222-2222-4222-8222-222222222222",
  agent_id: "checkout-agent",
  action_type: "http.request",
  resource: "https://example.com/orders",
})

console.log(result.decision)
```

`decision` is `allow`, `deny`, or `approval_required`. Adapters such as `@limetry/cli`, `@limetry/sql`, and `@limetry/shopify` call this same engine.

## Privacy

Do not put API keys, passwords, or chat transcripts in action metadata. Use `redactDetails` and `projectIntentForAudit` before you store an audit record. The default audit mode keeps a minimized projection.

## License

MIT
