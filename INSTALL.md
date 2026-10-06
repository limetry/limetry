# Installing Limetry

This page covers every supported way to install the Limetry CLI, SDK, MCP server, and governance
server — plus the roadmap for distribution channels that are planned but not yet live. We only list a
channel as "available" when it actually works today.

## TL;DR by Role

| You are a… | Install this | How |
| --- | --- | --- |
| Agent developer | `@limetry/sdk` | `npm install @limetry/sdk` |
| Terminal user | `@limetry/cli` | `npm install -g @limetry/cli` |
| MCP user (Claude/Cursor) | `@limetry/mcp` | `npx -y @limetry/mcp` |
| Operator (self-hosting) | `@limetry/server` | From source or Docker (`packages/server/Dockerfile`) |

## Channel Status

| Channel | Status | Notes |
| --- | --- | --- |
| Source checkout (all platforms) | **Available** | Yarn Berry 4.13 is required for repository development |
| npm / npx | **Published** | Install published packages directly; releases use `.github/workflows/publish-npm.yml` |
| Docker (server) | **Available** | `packages/server/Dockerfile` |
| Homebrew (macOS / Linuxbrew) | Planned — next | Formula wrapping the npm package or release tarball |
| Standalone binaries (GitHub Releases) | Planned — next | Node SEA multi-arch builds |
| winget / Scoop / Chocolatey (Windows) | Planned | Requires release binaries first |
| deb / rpm (Linux) | Planned | Based on demand, after binaries |
| macOS DMG, Windows MSI, AppImage, Snap | Not planned | Limetry's CLI is a terminal tool; desktop-app installers do not fit. Package managers above cover every platform |
| iOS / Android native apps | Not planned here | Use the web dashboard and HTTP API from mobile; native approval apps are part of the separate commercial offering |

## Install the published packages

These commands install published packages, so use npm, Yarn, or pnpm according
to your project. The examples use npm; `yarn add` and `pnpm add` are equivalent.
For an MCP host, `npx` can be replaced with `yarn dlx` or `pnpm dlx`.

```bash
npm install -g @limetry/cli
npm install @limetry/sdk
npx -y @limetry/mcp
```

For an adapter, install only what you use:

```bash
npm install @limetry/ci @limetry/sql @limetry/shopify
```

## Build from Source (Secondary)

Clone and build from source when developing Limetry itself, testing unreleased
changes, or running a fully local governance server.

### Prerequisites

| Tool | Version | Install |
| --- | --- | --- |
| Node.js | 20+ | [nodejs.org](https://nodejs.org/) or your package manager |
| Yarn Berry | 4.13.0, supplied by the repository | Enable it with Corepack before installing |

The cloned repository is a Yarn Berry workspace. Do not run `npm install`,
`pnpm install`, or Yarn Classic in the checkout: the repository uses Yarn
workspace protocols, resolutions, package extensions, and the committed
`yarn.lock`. Do not commit another package manager's lockfile.

### macOS and Linux

```bash
git clone https://github.com/limetrydev/limetry.git
cd limetry
```

Enable Corepack, install with the repository's pinned Yarn version, and run the
workspace scripts through Yarn:

```bash
corepack enable
yarn install
yarn build:sdk
yarn build:preflight
yarn build:server
yarn build:cli
```

Run the CLI:

```bash
node packages/cli/dist/index.js --help
```

### Windows

Limetry builds on Windows with Node.js 20+ and Yarn Berry 4.13. Use PowerShell
or Git Bash:

```powershell
git clone https://github.com/limetrydev/limetry.git
cd limetry
```

Then install and build with the repository's Yarn workspace:

```powershell
corepack enable
yarn install
yarn build:sdk
yarn build:preflight
yarn build:server
yarn build:cli
node packages\cli\dist\index.js --help
```

Windows Subsystem for Linux (WSL2) is also fully supported via the Linux instructions.

### Mobile (iOS / Android)

The CLI and SDK are not mobile apps. From a phone or tablet you can:

- Reach any self-hosted Limetry server's HTTP API (it is plain HTTPS + JSON).
- Use the web dashboard of the separately offered managed product.
- On Android, run the CLI under [Termux](https://termux.dev/) with Node.js 20+ (community-supported,
  not part of CI).

## npm publishing

The public npm packages are `@limetry/sdk`, `@limetry/cli`, `@limetry/mcp`,
`@limetry/preflight`, `@limetry/ci`, `@limetry/shopify`, `@limetry/sql`, and
`@limetry/ui`. All are published at the same version from one release tag.

### Publish from a clean checkout (maintainers)

Requires a clean `main` or `master` checkout pushed to `origin`, and npm Trusted
Publishing configured for each package. Do not add an npm write token or
`NPM_TOKEN` GitHub Actions secret. Every release command pushes one immutable
`v<root-version>` tag; that tag triggers the shared GitHub Actions workflow and
publishes every package, whether its source changed or not.

```bash
yarn release
```

Run releases from a Yarn-installed checkout. Publishing itself is performed by
npm Trusted Publishing in GitHub Actions; maintainers do not need an npm token
locally.

For a failed/partial publish, run **Actions → Build and publish all @limetry
packages → Run workflow** on `main`. Package versions already present on npm are
skipped; the workflow retries the remaining packages with the same version.

The workflow builds and tests packages, then publishes them with GitHub OIDC.
npm requires Node 22.14+ and npm 11.5.1+ for Trusted Publishing; the workflow
uses Node 24 and npm 11.5.1. npm generates provenance automatically. Release
versions are semver (`1.2.42`) in the root manifest and in every publishable
package.json. One-off publish from a package directory is `npm publish`; pack
scripts rewrite `workspace:` ranges for the tarball and restore the files.

```bash
npm publish --access public
```

### Configure Trusted Publishing on npmjs.com

For every package above, open **Package settings → Trusted publishing** and add
a GitHub Actions publisher with organization/user `limetry`, repository `limetry`,
no Environment name, and permission for direct `npm publish`. Configure the
workflow filename `publish-npm.yml` (filename only) for all eight packages. If
you previously added trusted publishers for the separate package workflows,
remove those entries and recreate them with this shared workflow filename.

After verifying a successful publish, revoke the old npm automation token. You
can then enable **Require two-factor authentication and disallow tokens** in npm
publishing access settings. Package metadata must retain the repository URL
`https://github.com/limetry/limetry.git` for npm to validate the publisher.

### Install from npm

```bash
npm install -g @limetry/cli
npx -y @limetry/cli setup

npm install @limetry/sdk

npx -y @limetry/mcp
```

Use the source instructions above only when you are developing the repository itself.

## Docker (Server)

Build and run the governance server without a local Node toolchain:

```bash
docker build -f packages/server/Dockerfile -t limetry-server .
docker run --rm -p 3810:3810 \
  -e LIMETRY_BEARER_TOKEN=your-secure-bearer-token \
  -e DECISION_HMAC_SECRET=your-decision-hmac-secret-min-32-chars \
  limetry-server
```

The image contains the TypeScript server and its compiled dependencies; it does
not require Rust or a separate native library. See [USAGE.md](USAGE.md),
`.env.example`, and `.env.production.example` for production environment
requirements (`USE_POSTGRES_STORE=true`, unique `JWT_SECRET` / `LIMETRY_BEARER_TOKEN` /
`DECISION_HMAC_SECRET`, and a non-loopback `DATABASE_URL`). Pulumi injects those keys from stack
secrets — see [packages/infra/README.md](packages/infra/README.md).

## Distribution Roadmap

1. **GitHub Release binaries** — self-contained CLI executables (macOS arm64/x64, Linux arm64/x64,
   Windows x64) built with Node SEA.
2. **Homebrew** — `brew install limetrydev/tap/limetry`, wrapping the release artifacts.
3. **Windows package managers** — winget and Scoop manifests referencing the release binaries.
4. **Linux packages** — deb/rpm via nfpm if operator demand warrants it.

Each channel is added to this page — and only to this page — when it actually works.
