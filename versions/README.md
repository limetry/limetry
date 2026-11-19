# Versions

Limetry has two version lines.

## Product

Packages, websites, and the Cloud checkout share one semver (`1.2.46`).
Only `main` / `master` commits a product version. Feature-branch
`yarn release:aws` (from **limetry-enterprise**) and `deploy-infra.yml` stamp
an ephemeral `next-patch-beta.N` for the deploy, then restore version files
so the PR keeps the last stable version.

Product versioning is driven by **releasekit**. Dual-stack releases and
`align-product-version` run from the private **limetry-workspace** parent so
this public repo stays free of release orchestration. The runtime
`AppVersion()` helper reads the monorepo root `package.json` (no stamped
`app-version.ts`).

A release is compatible with other product versions on the same minor line,
for example `>=1.2.0 <1.3.0`.

## Schemas

OpenAPI documents, JSON contracts, and the Cloud database schema start at
`1.0.0`. They do not move when the product version moves. Schema helpers under
`scripts/schema-versions.ts` bump a schema only when its contents change.

Policy documents still use their own integer `version` field. That number is a
policy revision, not this schema semver.

## Compatibility

**`versions/compatibility.json` is the single source of truth** for the
published map of this product version to package, website, and schema ranges.

Derived (do not edit by hand):

- `packages/sdk/src/compatibility.ts` — `COMPATIBILITY` export for `@limetry/sdk`
- `packages/web/public/compatibility.json` — static site copy (gitignored; created
  at web build / parent align time)
