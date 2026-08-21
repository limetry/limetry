#!/usr/bin/env bash
#
# vercel-install.sh — Vercel / CI install for the OSS limetry monorepo.
#
# Purpose:
#   Use the committed Yarn 4 binary. Vercel default install is Yarn Classic
#   1.22.x, which cannot parse Berry resolutions such as
#   "undici@npm:^6.25.0": "npm:6.28.0". Focus app workspaces only — never
#   packages/infra (Pulumi / @pulumi/command).
#
# Inputs:
#   - Expects monorepo root layout (script lives in scripts/)
#   - Uses .yarn/releases/yarn-4.13.0.cjs
#   - Env: unsets ENABLE_EXPERIMENTAL_COREPACK to avoid Vercel yarn bootstrap breakage
#   - No CLI args
#
# Side effects:
#   - cd to monorepo root
#   - yarn workspaces focus for sdk/ui/preflight/server/web
#   - Builds @limetry/sdk and @limetry/preflight
#   - Exits non-zero on any command failure (`set -euo pipefail`)
#

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Corepack + Yarn 4 + root "type":"module" can break Vercel's yarn bootstrap.
unset ENABLE_EXPERIMENTAL_COREPACK || true

YARN="$ROOT/.yarn/releases/yarn-4.13.0.cjs"

# App/runtime packages only. packages/infra pulls @pulumi/command whose
# postinstall requires the Pulumi CLI and does not belong on Vercel.
node "$YARN" workspaces focus \
  @limetry/sdk \
  @limetry/ui \
  @limetry/preflight \
  @limetry/server \
  @limetry/web

node "$YARN" workspace @limetry/sdk build
node "$YARN" workspace @limetry/preflight build
