# Versions

Limetry has two version lines.

## Product

Packages, websites, and the Cloud checkout share one semver (`1.2.46`).
`yarn release:aws` from **limetry-enterprise** stamps both checkouts, deploys
Core then Cloud Pulumi surfaces, and tags both repos only after both succeed.
`yarn release` / `yarn release:vercel` from this checkout still stamp product
files and can watch Vercel. `yarn sync-version` restamps every product file
from the root `package.json` without bumping.

A release is compatible with other product versions on the same minor line,
for example `>=1.2.0 <1.3.0`.

## Schemas

OpenAPI documents, JSON contracts, and the Cloud database schema start at
`1.0.0`. They do not move when the product version moves. `yarn sync-version`
bumps a schema only when its contents change (patch by default). Pass
`--schema-bump=minor` or `--schema-bump=major` when that change is not a patch.

Policy documents still use their own integer `version` field. That number is a
policy revision, not this schema semver.

## Compatibility

`versions/compatibility.json` is the published map of this product version to
package, website, and schema ranges. The same document is exported as
`COMPATIBILITY` from `@limetry/sdk` and copied to the website at
`/compatibility.json`.
