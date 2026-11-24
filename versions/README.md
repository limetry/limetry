# Versions

Limetry has three version lines.

## Product (platform semver)

Packages, websites, and the Cloud checkout share one semver (`1.2.x`).
Only **published** package source changes bump this number (npm matrix +
PyPI `limetry`). Feature-branch AWS deploys (`deploy-infra.yml`) stamp an
ephemeral `next-patch-beta.N`, then restore version files so the PR keeps
the last stable version.

Product versioning is driven by **releasekit** from the private
**limetry-workspace** parent only (`yarn release` / `yarn release:aws` /
`yarn deploy:aws`). This public repo has no releasekit config or release
scripts.

Platform semver bumps **only when** kernel package sources change
(`versionGate.paths` in the parent releasekit config). The gate hashes
`@limetry/{sdk,cli,mcp,ci,sql,shopify}` and `packages/sdk-python` — not
`@limetry/ui` / `@limetry/preflight`, server/API shells, marketing sites, or
stamp/align outputs (`compatibility.*`, embedded build-info). Those ship as
**build-only** (footer `vA.B.C-X`); use `--force-bump` for an intentional
ui/preflight-only npm cut. Git tags (`v1.2.N`) only when semver actually bumps.

Runtime labels:

- `AppVersion()` — package / CLI / health: `vA.B.C` (or `vA.B.C-dev-Y` locally)
- `AppFooterVersion()` — website footers only: `vA.B.C-X` (X = build)

A release is compatible with other product versions on the same minor line,
for example `>=1.2.0 <1.3.0`.

## Build (deploy counter)

`build-info.json` at the repo root holds a **per-version** build integer.
It resets to `1` whenever platform `version` changes, then increments on later
same-version release/deploy stamps.

- Website footers (`AppFooterVersion()`): `vA.B.C-X` (X = build)
- Local development: `vA.B.C-dev-Y` (Y = commits since last push, seeded by
  `seedDevVersionEnv` in `@limetry/preflight`)

The build increments on parent `yarn release` and deploy-only flows
(`yarn deploy:aws` → `releasekit build --increment`) **without** a new git tag
when semver did not bump.

| Field | Role |
|--------|------|
| `version` | Mirror of platform semver |
| `build` | Per-version deploy suffix X in footer `vA.B.C-X` |
| `contentHash` | Hash of `versionGate.paths` — gates the next platform bump |
| `gitSha` / `builtAt` | Traceability |

`AppVersion()` / `AppFooterVersion()` embed root `build-info.json` into the SDK
at build/align time (`scripts/embed-sdk-build-info.mjs` → gitignored
`build-info.generated.ts`). Do not commit package-local copies.

## Schemas

OpenAPI documents, JSON contracts, and the Cloud database schema start at
`1.0.0`. They do not move when the product version moves. Schema helpers under
`scripts/schema-versions.ts` bump a schema only when its contents change.

Policy documents still use their own integer `version` field. That number is a
policy revision, not this schema semver.
