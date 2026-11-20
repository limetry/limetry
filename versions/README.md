# Versions

Limetry has three version lines.

## Product (platform semver)

Packages, websites, and the Cloud checkout share one semver (`1.2.x`).
Only product-source changes bump this number. Feature-branch
`yarn release:aws` (from **limetry-enterprise**) and `deploy-infra.yml` stamp
an ephemeral `next-patch-beta.N` for the deploy, then restore version files
so the PR keeps the last stable version.

Product versioning is driven by **releasekit**. Dual-stack releases and
`align-product-version` run from the private **limetry-workspace** parent so
this public repo stays free of release orchestration. The runtime
`AppVersion()` helper reads the package `package.json` (no stamped
`app-version.ts`).

Platform semver bumps **only when** configured product paths change
(`versionGate.paths` in the parent releasekit config). Pure marketing / site
UI churn can ship without `1.2.N+1`. Git tags (`v1.2.N`) are created only when
semver actually bumps.

A release is compatible with other product versions on the same minor line,
for example `>=1.2.0 <1.3.0`.

## Build (deploy counter)

`build-info.json` at the repo root holds a monotonic **build** integer used in
footers and preflight (`AppBuild().label`, e.g. `v1.2.94 · 1847`). The build
increments on `releasekit release` and on deploy-only flows
(`releasekit build --increment` / `yarn deploy:aws`) **without** a new git tag.

| Field | Role |
|--------|------|
| `version` | Mirror of platform semver |
| `build` | Footer unique id (always increments on release/deploy) |
| `contentHash` | Hash of `versionGate.paths` — gates the next platform bump |
| `gitSha` / `builtAt` | Traceability |

OSS mirrors root `build-info.json` into `packages/sdk/build-info.json` (for
`AppBuild`) and `packages/web/public/build-info.json` during align / deploy.

## Schemas

OpenAPI documents, JSON contracts, and the Cloud database schema start at
`1.0.0`. They do not move when the product version moves. Schema helpers under
`scripts/schema-versions.ts` bump a schema only when its contents change.

Policy documents still use their own integer `version` field. That number is a
policy revision, not this schema semver.
