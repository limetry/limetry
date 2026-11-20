# Versions

Limetry has three version lines.

## Product (platform semver)

Packages, websites, and the Cloud checkout share one semver (`1.2.x`).
Only product-source changes bump this number. Feature-branch AWS deploys
(`deploy-infra.yml`) stamp an ephemeral `next-patch-beta.N`, then restore
version files so the PR keeps the last stable version.

Product versioning is driven by **releasekit** from the private
**limetry-workspace** parent only (`yarn release` / `yarn release:aws` /
`yarn deploy:aws`). This public repo has no releasekit config or release
scripts. The runtime `AppVersion()` helper reads the package `package.json`
(no stamped `app-version.ts`).

Platform semver bumps **only when** configured product paths change
(`versionGate.paths` in the parent releasekit config). The gate hashes API
kernels and route/service cores — not `create-app` shells, marketing sites,
`packages/ui`, static `public/` HTML, or `**/presentation/**`. Landing/404
chrome and import-sort on app factories ship as build-only. Git tags
(`v1.2.N`) are created only when semver actually bumps.

A release is compatible with other product versions on the same minor line,
for example `>=1.2.0 <1.3.0`.

## Build (deploy counter)

`build-info.json` at the repo root holds a monotonic **build** integer. Runtime
`AppVersion()` renders:

- Deploy / production: `vA.B.C-X` (X = build)
- Local development: `vA.B.C-dev-Y` (Y = commits since last push, seeded by
  `seedDevVersionEnv` in `@limetry/preflight`)

The build increments on parent `yarn release` and deploy-only flows
(`yarn deploy:aws` → `releasekit build --increment`) **without** a new git tag.

| Field | Role |
|--------|------|
| `version` | Mirror of platform semver |
| `build` | Deploy suffix X in `vA.B.C-X` |
| `contentHash` | Hash of `versionGate.paths` — gates the next platform bump |
| `gitSha` / `builtAt` | Traceability |

OSS mirrors root `build-info.json` into `packages/sdk/build-info.json` (for
`AppVersion`) and `packages/web/public/build-info.json` during align / deploy.

## Schemas

OpenAPI documents, JSON contracts, and the Cloud database schema start at
`1.0.0`. They do not move when the product version moves. Schema helpers under
`scripts/schema-versions.ts` bump a schema only when its contents change.

Policy documents still use their own integer `version` field. That number is a
policy revision, not this schema semver.
