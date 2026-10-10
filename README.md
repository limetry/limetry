# Limetry

Limetry is open-source **agent action governance**. Before an irreversible tool
runs, your agent submits an action intent. The server checks it against your
action policy and returns `allow`, `deny`, or `approval_required` with reasons
and a signed outcome receipt. Audit storage keeps a **privacy-safe record** you
can tail from the CLI or MCP.

Open source (MIT license). Run your own node from this repository. Enforce
outcomes in the agent loop or resource middleware — Limetry is advisory until you do.

The product is the evaluate stack (SDK, CLI, MCP, server). Optional adapters
extend it for CI, SQL, Shopify, and other surfaces you wire into agent loops.

**Example adapters (install only what you need):**

| Package | Role |
| --- | --- |
| `@limetry/ci` | GitHub Action + helpers for privilege / release gating (`repo@sha`) |
| `@limetry/sql` | Postgres/Supabase MCP write gate that owns `DATABASE_URL` |
| `@limetry/shopify` | Admin API mutation firewall that holds the Admin token |

Shared core: `@limetry/sdk`, `@limetry/server`, `@limetry/cli`, `@limetry/mcp`.

> [!WARNING]
> Agents can **bypass Limetry** unless your middleware or downstream resource
> rejects actions without a verified evaluation or approval. Outcomes are
> **advisory by default**. Call `evaluateAction` (SDK), `limetry eval` (CLI), or
> `limetry_evaluate` (MCP) and enforce the decision in your loop. Read
> [SECURITY.md](SECURITY.md).
> [!NOTE]
> Policy matching uses the full intent. Audit stores a privacy-safe record
> (`audit_mode=minimal` by default). Do not put secrets or chat transcripts in
> `metadata` / `details`.

## What evaluate covers

| Input | Limetry response |
| --- | --- |
| Irreversible tool call | Policy check before execute |
| High-risk action | `approval_required` + payload-hash-bound approve |
| Failed action with no trail | Privacy-safe `policy.evaluated` / `action.recorded` audit |
| Policy living only in prompts | Server-authoritative action policy over HTTP |
| IDE-native operators | MCP + CLI against a self-hosted node |

## How it works

```text
Agent / SDK / MCP / adapter ──→ action intent
                                          │
                                          ▼
                              Policy evaluation (HTTP server)
                              allow · deny · approval_required · receipt
                                          │
                                          ▼
                              Privacy-safe audit (+ pending approvals store)
                                          │
                                          ▼ (enforce in adapter / middleware)
                              Tool execution
```

1. **Intent** — propose an action (type, resource, optional cost).
2. **Evaluate** — action policy rules: types, resource patterns, cost caps, approval knobs.
3. **Outcome** — `allow`, `deny`, or `approval_required` (durable pending row + payload hash).
4. **Audit** — privacy-safe events; tail via CLI or MCP.
5. **Approve** — reviewer resolves pending approvals; adapters resume only after hash match.

## What's in this repository

| Component | Path | Role |
| --- | --- | --- |
| Governance server | `packages/server` | Policy checks, approvals, privacy-safe audit, policies |
| TypeScript SDK | `packages/sdk` | Limetry SDK, redact helpers, slim policies |
| CLI | `packages/cli` | setup, policy apply, eval, approvals, audit tail |
| MCP server | `packages/mcp` | MCP tools for Cursor / Claude Desktop |
| CI adapter | `packages/ci` | `@limetry/ci` GitHub Action + library |
| SQL adapter | `packages/sql` | `@limetry/sql` Postgres/Supabase write gate |
| Shopify adapter | `packages/shopify` | `@limetry/shopify` Admin mutation firewall |
| Website + docs | `packages/web` | limetry.com marketing site and documentation |
| Agent skill | `packages/limetry-skill` | Drop-in skill for coding agents |
| Examples | `examples/` | Action intent walkthroughs |

## Installation

Published packages are the normal installation path. Use the package manager
you prefer; these examples use npm.

```bash
npm install -g @limetry/cli
npm install @limetry/sdk
npx -y @limetry/mcp
```

Use [INSTALL.md](INSTALL.md) for local source development, self-hosting, and
the distribution matrix. A cloned repository is a Yarn Berry 4.13 workspace:
run `corepack enable` and `yarn install`, then use Yarn for its workspace
scripts. npm, Yarn, and pnpm are interchangeable when installing the published
packages above.

```bash
corepack enable
yarn install
yarn build:sdk
yarn build:preflight
yarn build:server
yarn build:cli
```

Start a locally built server with `yarn dev:server`.

## Deploy the serverless API

Two deployment paths share the same API bundle and environment model:

| Path | Package | Orchestration |
| --- | --- | --- |
| Pulumi | [`packages/cloud-serverless`](packages/cloud-serverless/README.md) | `pulumi up` per stack |
| SST | [`packages/serverless`](packages/serverless/README.md) | `npm run deploy` (SST state on AWS) |

Pick one **compute** provider: `aws`, `gcp`, or `azure`. Pick one **database**
mode: `neon` (shared durable default on Pulumi), `sqlite` (ephemeral), or `rds`
(AWS only, private VPC). Pick **DNS** when using a custom hostname:

- **`dnsProvider: native`** (default) — Route 53 on AWS, Cloud DNS on GCP,
  Azure DNS on Azure. The zone must exist in that cloud and be authoritative
  (nameservers delegated).
- **`dnsProvider: cloudflare`** — optional; creates **DNS-only** records
  (`proxied: false`) in Cloudflare for any compute provider.
- **`manageDns: false`** — no automatic records; apply `apiDnsRecords` from
  stack output at your registrar.

Install dependencies, authenticate the target cloud, then follow the README for
the path you chose. Pulumi deployment commands build required Lambda, web, and
container artifacts automatically. Example (Pulumi, AWS):

```bash
aws sso login
cd packages/cloud-serverless && pulumi up
```

## Quickstart

```bash
limetry setup
limetry policy apply --agent-id demo --allow http_get --deny http_post \
  --block-resource "https://prod.example.com/*"
echo '{"intent_id":"...","policy_id":"...","agent_id":"demo","action_type":"http_post","resource":"https://prod.example.com/x","issued_at":"2026-07-21T20:00:00.000Z"}' \
  | limetry eval
limetry approvals list
limetry audit tail
```

Docs: [CI](packages/web/content/docs/ci/index.mdx) · [SQL](packages/web/content/docs/sql/index.mdx) ·
[Shopify](packages/web/content/docs/shopify/index.mdx) · [USAGE.md](USAGE.md) · [SECURITY.md](SECURITY.md)

## Publishing npm packages

Every successful `yarn release` from a clean Yarn Berry checkout publishes all
eight public packages at the version in the root `package.json`. The release pushes one `v<version>` tag;
that tag triggers a single GitHub Actions workflow which builds, tests, and
publishes the packages in dependency order. AWS releases push the tag only after
the deploy succeeds.

Publishable packages are `sdk`, `cli`, `mcp`, `preflight`, `ci`, `shopify`,
`sql`, and `ui`. The server, web app, infra, mobile app, shared workspace, and
skill are not published to npm.

Each release uses one immutable semver tag, such as `v1.2.42`; there are no
package-specific publish tags or package change checks. All packages are
published every release, even if some package sources did not change. To retry
or complete a partially failed release, run **Actions → Build and publish all
@limetry packages → Run workflow** on `main`. Already-published package versions
are skipped, so the retry can finish the remaining packages.

The `v*` tag runs `.github/workflows/publish-npm.yml`. Publishing uses npm
Trusted Publishing via GitHub Actions OIDC; no npm write token or `NPM_TOKEN`
Actions secret is needed. npm generates provenance. Root and publishable
package versions are the same semver (`1.2.42`). `npm publish` rewrites Yarn
`workspace:` ranges to that semver while packing, then restores the manifests.

### Configure npm Trusted Publishing

For each published package on npmjs.com, add a GitHub Actions trusted publisher
under **Package settings → Trusted publishing**:

- Organization or user: `limetry`
- Repository: `limetry`
- Workflow filename: `publish-npm.yml` (filename only)
- Allow direct `npm publish`; leave Environment name empty

Add this same publisher configuration separately to all eight npm packages.

The publisher workflows use Node 24 and npm 11.5.1, grant `id-token: write`,
and the published package metadata points to
`https://github.com/limetry/limetry.git`.
Test a trusted publish before removing any existing token access. Once verified,
revoke the old npm automation token and, if desired, enable **Require two-factor
authentication and disallow tokens** in npm publishing access settings.

If you previously configured per-package trusted publishers, remove those
connections and add `publish-npm.yml` as the workflow filename for each package.

## Documentation

| Surface | Where | How it is produced |
| --- | --- | --- |
| Product docs | [limetry.org/docs](https://limetry.org/docs/introduction) | Build with `yarn build:web` / Vercel |
| OpenAPI / Swagger | `GET /openapi` on the evaluate server (local: <http://localhost:3810/openapi>) | Source: `packages/server/openapi.yaml`. Synced into `public/` with the selected tool's workspace command. |
| Package API reference (TypeDoc) | [Markdown on `docs`](https://github.com/limetry/limetry/blob/docs/README.md) · local: `docs/api/` (gitignored on `main`) | CI publishes Markdown on release tags (`Publish TypeDoc`). GitHub renders `.md` on the branch — no Pages required. Optional later: HTML + GitHub Pages for a site theme. |

TypeDoc is for library consumers browsing package exports. Product guides stay on Fumadocs.

- **Browse (GitHub):** [API index](https://github.com/limetry/limetry/blob/docs/README.md) · [sdk](https://github.com/limetry/limetry/blob/docs/%40limetry/sdk/README.md) · [server](https://github.com/limetry/limetry/blob/docs/%40limetry/server/README.md) · [cli](https://github.com/limetry/limetry/blob/docs/%40limetry/cli/README.md) · [mcp](https://github.com/limetry/limetry/blob/docs/%40limetry/mcp/README.md) · [ui](https://github.com/limetry/limetry/blob/docs/%40limetry/ui/README.md) · [preflight](https://github.com/limetry/limetry/blob/docs/%40limetry/preflight/README.md) · [ci](https://github.com/limetry/limetry/blob/docs/%40limetry/ci/README.md) · [sql](https://github.com/limetry/limetry/blob/docs/%40limetry/sql/README.md) · [shopify](https://github.com/limetry/limetry/blob/docs/%40limetry/shopify/README.md)
- **Generate locally:**

```bash
yarn docs:api
# open docs/api/README.md (or browse the docs branch links above)
```

## Quality

| Script | Description |
| --- | --- |
| `yarn lint` | Root flat ESLint (`eslint.config.mjs`) across packages/examples |
| `yarn typecheck` | Parallel native TypeScript check (`tsgo`) across all packages and examples |
| `yarn docs:api` | TypeDoc Markdown under `docs/api/` (gitignored) |
| `yarn docs:api:watch` | TypeDoc watch mode |
| `yarn docs:check` | TypeDoc + OpenAPI sync/validate (release gate) |

TSDoc is enforced via `eslint-plugin-tsdoc` (`tsdoc/syntax`). Escape package names like
`\@limetry/sdk` inside doc comments so they are not parsed as tags.

## License

MIT
