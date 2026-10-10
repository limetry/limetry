# Limetry infrastructure (Pulumi)

Pay-as-you-go AWS for the **evaluation API and static marketing/docs site**.
This stack deploys those two surfaces. It does not run MCP, CLI, or adapter
packages.

| Surface | Resources |
| --------- | ----------- |
| `packages/web` | S3 + CloudFront (static export) |
| `packages/server` | Lambda (Node 20) + API Gateway HTTP API |
| Database | Neon serverless Postgres (you create it; URI in Pulumi + SSM) |
| DNS | Optional Route53; always exports Cloudflare CNAME targets |

**Not deployed on AWS** (and should not be):

| Package | Why |
| --------- | ----- |
| `@limetry/mcp` | stdio MCP server. Cursor/Claude spawn it locally; it calls `LIMETRY_BASE_URL` (the API above). |
| `@limetry/cli` / `@limetry/sdk` / `@limetry/ci` | Client libraries and a GitHub Action. |
| `@limetry/sql` / `@limetry/shopify` | Adapters that sit next to the resource, not on this stack. |

**Explicit non-goals:** ECS, EKS, RDS, App Runner, ElastiCache, always-on EC2, NAT gateways.

## Pulumi config you must set

Run from `packages/infra` after `pulumi stack select oss-prod`. Project name is `limetry-oss`, so keys are `limetry-oss:<name>` (the prefix is implied).

### Required secrets (not in git)

> [!WARNING]
> These four are `config.requireSecret`. `pulumi up` fails until they exist in the
> Pulumi Service stack. Do not commit them. Generate secrets unique to this stack —
> do not reuse sibling stack secrets.

| Key | Maps to Lambda env | How to set |
| ----- | -------------------- | ------------ |
| `databaseUrl` | `DATABASE_URL` | Neon **pooled** URI with `sslmode=verify-full` |
| `jwtSecret` | `JWT_SECRET` | `openssl rand -hex 32` — unique to this stack |
| `bearerToken` | `LIMETRY_BEARER_TOKEN` | `openssl rand -hex 32` — unique to this stack |
| `decisionHmacSecret` | `DECISION_HMAC_SECRET` | `openssl rand -hex 32` — required in production; not JWT |

```bash
cd packages/infra
pulumi stack select oss-prod   # or: pulumi stack init oss-prod

pulumi config set --secret databaseUrl 'postgresql://USER:PASS@HOST/neondb?sslmode=verify-full'
pulumi config set --secret jwtSecret "$(openssl rand -hex 32)"
pulumi config set --secret bearerToken "$(openssl rand -hex 32)"
pulumi config set --secret decisionHmacSecret "$(openssl rand -hex 32)"
```

Keep `jwtSecret`, `bearerToken`, and `decisionHmacSecret` private to this stack.

### Example stack configuration (plain)

| Key | Current oss-prod value | Notes |
| ----- | ------------------------ | ------- |
| `aws:region` | `us-west-2` | AWS provider region (API Gateway, Lambda, S3). CloudFront is global; its ACM certs must be in **us-east-1**. |
| `domain` | `example.com` | Apex for the marketing/docs site |
| `apiHostname` | `api.example.com` | Public evaluate API host |
| `portalHostname` | `app.example.com` | Optional app origin baked into the static export |
| `manageRoute53` | `false` | DNS lives in Cloudflare |
| `manageCloudflare` | `true` | Create Cloudflare CNAMEs + ACM DNS validation |
| `cloudflareZoneName` | `example.com` | Cloudflare zone for the stack |
| `createHostedZone` | `false` | Only used if `manageRoute53=true` |
| `serverArtifactPath` | `../server/lambda-bundle` | Built by Pulumi (`buildArtifacts`) |
| `webDistPath` | `../web/out` | Built by Pulumi (`LIMETRY_STATIC_EXPORT=1`) |
| `buildArtifacts` | `true` | Build Lambda + web during `pulumi preview` / `pulumi up` |

### Optional

| Key | Default | Secret? | Description |
| ----- | --------- | --------- | ------------- |
| `authSigningPrivateKeyHex` | — | yes | 64-hex Ed25519 seed for legacy authorize artifacts |
| `redisUrl` | — | yes | Upstash (or compatible) Redis. Not required to boot. |
| `neonProjectId` | — | no | Metadata only (SSM `NEON_METADATA`) |
| `neonBranchId` | — | no | Metadata only |
| `hostedZoneId` | — | no | Existing Route53 zone; required if `manageRoute53=true` and `createHostedZone=false` |
| `manageCloudflare` | `true` | no | Create Cloudflare DNS + ACM certs. Needs `CLOUDFLARE_API_TOKEN` or `cloudflare:apiToken` |
| `cloudflareZoneName` | inferred | no | Zone for the configured domain |
| `cloudflareZoneId` | — | no | Skip zone lookup |
| `cloudflareProxied` | `false` | no | Ignored. Cloudflare DNS records are always DNS-only (never orange-clouded) |
| `invalidateOnDeploy` | `true` | no | CloudFront `/*` invalidation when the web dist hash changes |
| `cloudFrontCertificateArn` / `certificateArn` | — | no | Override ACM cert in **us-east-1** (CloudFront requirement) |
| `apiCertificateArn` | — | no | Override ACM cert in **stack region** |
| `syncWebAssets` | `true` | no | Sync `webDistPath` into S3 |
| `buildArtifacts` | `true` | no | Build Lambda + web during Pulumi. Set `false` or `LIMETRY_SKIP_ARTIFACT_BUILD=1` to skip |
| `replayWindowMs` | `300000` | no | Lambda `REPLAY_WINDOW_MS` |
| `throttleMaxRequestsPerMinute` | `5` | no | Lambda `THROTTLE_MAX_REQUESTS_PER_MINUTE` |
| `defaultAuditMode` | `minimal` | no | Lambda `LIMETRY_DEFAULT_AUDIT_MODE` |
| `auditRetentionDays` | `90` | no | Lambda `LIMETRY_AUDIT_RETENTION_DAYS` |
| `githubUrl` / `discordUrl` | product defaults | no | Baked into the static web export |
| `sentryDsn` | — | no | Lambda `SENTRY_DSN` + web `NEXT_PUBLIC_SENTRY_DSN` (falls back to process env) |
| `posthogPublicProjectToken` | — | no | Lambda + web PostHog project key (falls back to process env) |
| `posthogHost` | `https://us.i.posthog.com` | no | PostHog host for Lambda and static export |
| `forceDestroyWebBucket` | `true` | no | Allow `pulumi destroy` to empty the web bucket |
| `budgetAmount` | `5` | no | Monthly USD AWS Budget limit (Project + Stack tags) |
| `budgetActualWarningPercent` | `80` | no | ACTUAL spend warning threshold (%) |
| `budgetActualCriticalPercent` | `100` | no | ACTUAL spend critical threshold (%) |
| `budgetForecastedPercent` | `100` | no | FORECASTED spend threshold (%) |
| `notificationEmail` | contact email | no | Budget (and optional anomaly) alert recipient |
| `enableCostMonitoring` | `false` | no | When true with anomaly flag, create Cost Explorer monitors |
| `enableCostAnomalyDetection` | `false` | no | CUSTOM Project-tag anomaly subscription (requires `enableCostMonitoring`; not DIMENSIONAL SERVICE — account quota is 1) |

Skip ACM config keys when `manageCloudflare` is true — the stack issues certs via Cloudflare DNS validation.

### Stack budget (Pulumi-owned)

`budgetAmount` is USD; the three threshold keys are percentages. Change via Pulumi
config, then apply with `pulumi up` / `yarn deploy:infra`.

```bash
cd packages/infra
pulumi config set budgetAmount 25
pulumi config set budgetActualWarningPercent 70
pulumi config set budgetActualCriticalPercent 100
pulumi config set budgetForecastedPercent 90
pulumi up
```

## GitHub Actions secrets (deploy workflow)

`.github/workflows/deploy-infra.yml` also needs:

| GitHub secret / var | Purpose |
| --------------------- | --------- |
| `PULUMI_ACCESS_TOKEN` | Pulumi Service |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | `pulumi up` |
| `CLOUDFLARE_API_TOKEN` | Zone DNS Edit + Zone Read (CNAME + ACM validation) |
| `AWS_REGION` (optional var) | Defaults to `us-west-2` |

Stack config secrets stay in Pulumi Service, not GitHub.

## Setup

```bash
cd packages/infra
pulumi stack select oss-prod || pulumi stack init oss-prod
pulumi config set aws:region us-west-2
```

Then set the four required secrets above, plus a Cloudflare token:

```bash
pulumi config set --secret cloudflare:apiToken "$CLOUDFLARE_API_TOKEN"
```

## Build artifacts

`pulumi preview` and `pulumi up` build the Lambda bundle and Next.js static export
when `buildArtifacts` is true (the default) or when those directories are missing.
The web export uses this stack's `domain` / `apiHostname` / `portalHostname` so Preview
does not bake `localhost`.

Skip the in-program build only when the artifacts are already present:

```bash
LIMETRY_SKIP_ARTIFACT_BUILD=1 pulumi preview
```

Manual equivalent:

```bash
yarn workspace @limetry/server build:lambda
LIMETRY_STATIC_EXPORT=1 yarn workspace @limetry/web build
```

## Preview / deploy

```bash
yarn workspace infra typecheck
yarn workspace infra preview
yarn workspace infra up
```

Root shortcuts: `yarn typecheck:infra`, `yarn deploy:infra:preview`, `yarn deploy:infra`.

CI deploys stack `oss-prod`. A local `dev` stack (`Pulumi.dev.yaml`) is optional for previews; it uses the same four required secrets.

## Isolated API load-test stacks

Set `isLoadTestApiOnly=true` only on an ephemeral stack named
`load-target-*` or `load-test-*`. The stack guard rejects `dev`, `prod`, and
protected Limetry hostnames, and API-only mode skips web, certificate, and
Cloudflare resources.

Memory-store load tests do not need a database. For a persistent isolated
target, set `loadTestProtectedDatabaseHosts` to every production database host
before deploying; the Lambda rejects a protected host at runtime:

```bash
pulumi config set isLoadTestApiOnly true --stack load-target-limetry-run
pulumi config set isLoadTestStoreMemory false --stack load-target-limetry-run
pulumi config set loadTestProtectedDatabaseHosts prod-db.example.com \
  --stack load-target-limetry-run
```

Use a dedicated non-production database URL and update the protected-host
configuration whenever a production endpoint changes.

## DNS (Cloudflare)

`manageCloudflare` (default `true`) creates the records during `pulumi up`:

1. ACM DNS validation CNAMEs (DNS-only, not proxied)
2. Traffic CNAME `www` → CloudFront (or `@`/`www` on the apex stack) — always DNS-only
3. Traffic CNAME `api` → API Gateway custom domain — always DNS-only

> [!WARNING]
> All Cloudflare DNS records created by Pulumi are **never orange-clouded**
> (`proxied: false`). TLS and CDN terminate at AWS (ACM + CloudFront / API Gateway).
> Do not enable Cloudflare proxy on CNAMEs to CloudFront, API Gateway, or ACM
> validation targets.

Set a token once:

```bash
pulumi config set --secret cloudflare:apiToken "<zone-dns-edit-token>"
```

The token needs **Zone.DNS Edit** and **Zone.Read** on the configured zone.
Subsequent deploys sync the static export into the origin **bucket** (one S3
bucket resource, not per-file `BucketObject`s) and invalidate CloudFront `/*`
when `packages/web/out` changes.

Existing stacks that still track synced-folder objects can drop them from state (without deleting the files) before the next `pulumi up`:

```bash
node scripts/forget-s3-objects.mjs dev
```

## Neon

Create the project in the Neon console (free/launch is enough). This stack does not provision Neon. Optional later: `pulumi package add terraform-provider kislerdm/neon`.

## Outputs

| Output | Meaning |
| -------- | --------- |
| `websiteUrl` | Public docs/marketing URL (`https://example.com`) |
| `websiteWwwUrl` | `https://www.…` when the stack is the zone apex; empty otherwise |
| `websiteEdgeUrl` | CloudFront distribution URL |
| `apiUrl` / `apiEndpoint` | Legacy OSS stack API output; hosted API is `https://api.example.com` |
| `apiInvokeUrl` | Raw execute-api URL |
| `appUrl` | Optional app origin baked into the static export |
| `publicUrls` | All of the above plus Cloudflare CNAME hints |
| `ssmParameterPrefix` | SSM prefix `/limetry/<project>/<stack>` for secret copies |
| `cloudflareWebCnameTarget` / `cloudflareApiCnameTarget` | DNS targets |
