# `@limetry/preflight`

Startup preflight checks for Node.js apps: masked env reporting, optional connectivity
probes, pino logging, and a single canonical listen URL.

## Env injection model

`@limetry/preflight` is **product-agnostic**. It has no Zod schema and does not know
about `PortalEnv`, `ServerEnv`, or other product types.

- Pass an injected `source: NodeJS.ProcessEnv` into helpers (often defaulting to
  `process.env` **only at the call site**).
- Once `source` is in scope, **do not** read ambient `process.env` again inside that
  helper (breaks tests and hides missing keys).
- Product adapters should parse a typed env object for owned secrets/settings, then
  pass the same bag into `runPreflight({ env: source, envChecks: [...] })` for
  deployment flags (`NODE_ENV`, `VERCEL_*`, `NEXT_PHASE`) and shared origin resolvers.

## Install

```bash
npm install @limetry/preflight
```

Optional peers for store probes:

```bash
npm install pg ioredis
```

## Quick start

```ts
import {
  createHttpProbe,
  createPostgresProbe,
  envCheck,
  runPreflight,
} from "@limetry/preflight"

await runPreflight({
  product: "My App",
  envChecks: [
    envCheck({
      name: "DATABASE_URL",
      value: process.env.DATABASE_URL,
      secret: true,
      ok: Boolean(process.env.DATABASE_URL),
      required: process.env.NODE_ENV === "production",
    }),
    envCheck({
      name: "STRIPE_WEBHOOK_SECRET",
      value: process.env.STRIPE_WEBHOOK_SECRET,
      secret: true,
      ok: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      required: true,
      critical: false,
    }),
  ],
  configuration: [
    `NODE_ENV: ${process.env.NODE_ENV ?? "development"}`,
  ],
  probes: [
    createPostgresProbe({
      url: process.env.DATABASE_URL,
      required: process.env.NODE_ENV === "production",
    }),
    createHttpProbe({
      name: "upstream",
      url: "https://example.com/health",
      success: "Upstream reachable",
      failure: "Upstream unreachable",
      required: false,
    }),
  ],
  listenUrl: `http://localhost:${process.env.PORT ?? "3000"}`,
})
```

## Severity model

| Kind | `required` | `critical` | Banner | Startup (`failHard`) |
| --- | --- | --- | --- | --- |
| Optional | `false` | ignored | Optional / warn | Continues |
| Required (degraded) | `true` | `false` | Required / warn | Continues with warnings |
| Required (blocking) | `true` | omit / `true` | Required / fail | Throws |

`configuration` lines render under **Context** (NODE_ENV, ports, derived hosts). Pass/fail settings belong in `envChecks` so the banner can split **Required** vs **Optional**.

## Fail hard vs degrade: deployment guidance

**Short-circuit only when the process cannot do its primary job.** Prefer boot + degrade when a subset of routes or surfaces still works.

| Context | Prefer abort when… | Prefer boot + degrade when… |
| --- | --- | --- |
| **Vercel** (Next/serverless) | Build-time secrets for the surface being built are wrong; live Clerk/publishable keys on production marketing that must not ship test keys | Optional AI, analytics, or a BFF that only powers authenticated routes while static/home still SSG/serves |
| **AWS Lambda / API Gateway** | Auth secrets, primary datastore, or anything that makes every invocation 5xx | Secondary caches (Redis), billing webhooks, optional upstream proxies — return 503 on those routes, keep `/health` and core APIs up |
| **ECS/EKS + load balancer** | Dependencies that make the **health check** fail forever (restart storm) | Non-critical deps: keep health **200** (or a separate `/ready` vs `/live`), expose **DEGRADED** on a richer status, alert without killing the task |

Rules of thumb:

1. **Process-blocking (`critical`)** = without this, the binary’s job is unsafe or empty (wrong auth, no primary DB when the API is DB-backed, corrupt public URLs for a CDN site).
2. **Required-not-critical** = product feature is incomplete but home, docs, health, or a core slice still works (billing, secondary upstream, cache, AI helpers).
3. **Optional** = nice-to-have observability or integrations.
4. On orchestrators, never tie the LB health check to non-critical probes — that turns a Stripe outage into a restart loop.
5. Emit structured `preflight.complete` with `failedBlocking` / `failedRequired` / `failedOptional` and mirror degraded state in metrics/alarms.

## Behavior

- Blocking required failures throw in production (or when `failHard` is set).
- Required-not-critical and optional failures warn and never block startup.
- Connectivity is skipped in test environments unless `skipConnectivity: false`.
- Loopback listen URLs normalize to a single `localhost` line (no LAN enumeration).
- When Sentry or PostHog env keys are present, `collectConfiguredTelemetry` adds
  non-blocking probes.

## API surface

- `runPreflight` / `formatPreflightReport` / `createPreflightLogger`
- `envCheck` / `checkBlocksStartup` / `maskSecret` / `redactDatabaseUrl` / `listEffectiveDotenvFiles`
- Probes: HTTP, Postgres, Redis, Sentry, PostHog
- Listen helpers: `expandListenUrls`, `resolvePublicListenUrl`, `isLoopbackHostname`

## License

MIT
