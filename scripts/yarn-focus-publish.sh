#!/usr/bin/env bash
#
# Installs only OSS packages published or documented in CI (no Pulumi stacks).
# packages/cloud and packages/infra are excluded — they use file: SDKs and
# @pulumi/command postinstall that break immutable installs on GitHub Actions.
#

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

unset ENABLE_EXPERIMENTAL_COREPACK || true

YARN="$ROOT/.yarn/releases/yarn-4.13.0.cjs"

find "$ROOT" -name .DS_Store -delete

node "$YARN" workspaces focus \
  @limetry/sdk \
  @limetry/ui \
  @limetry/preflight \
  @limetry/cli \
  @limetry/mcp \
  @limetry/ci \
  @limetry/shopify \
  @limetry/sql \
  @limetry/server \
  @limetry/web
