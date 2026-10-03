# Installing Limetry

This page covers every supported way to install the Limetry CLI, SDK, MCP server, and governance
server — plus the roadmap for distribution channels that are planned but not yet live. We only list a
channel as "available" when it actually works today.

## TL;DR by Role

| You are a… | Install this | How |
| --- | --- | --- |
| Agent developer | `@limetry/sdk` | From source today; npm once published |
| Terminal user | `@limetry/cli` | From source today; npm/Homebrew planned |
| MCP user (Claude/Cursor) | `@limetry/mcp` | From source today; `npx -y @limetry/mcp` once published |
| Operator (self-hosting) | `@limetry/server` | From source or Docker (`packages/server/Dockerfile`) |

## Channel Status

| Channel | Status | Notes |
| --- | --- | --- |
| Source checkout (all platforms) | **Available** | Reference path; always works |
| npm / npx | **Ready to publish** | `.github/workflows/publish-npm.yml`, triggered by semver tags such as `v1.2.42` |
| Docker (server) | **Available** | `packages/server/Dockerfile` |
| Homebrew (macOS / Linuxbrew) | Planned — next | Formula wrapping the npm package or release tarball |
| Standalone binaries (GitHub Releases) | Planned — next | Node SEA multi-arch builds |
| winget / Scoop / Chocolatey (Windows) | Planned | Requires release binaries first |
| deb / rpm (Linux) | Planned | Based on demand, after binaries |
| macOS DMG, Windows MSI, AppImage, Snap | Not planned | Limetry's CLI is a terminal tool; desktop-app installers do not fit. Package managers above cover every platform |
| iOS / Android native apps | Not planned here | Use the web dashboard and HTTP API from mobile; native approval apps are part of the separate commercial offering |

## Install from Source (All Platforms)

### Prerequisites

| Tool | Version | Install |
| --- | --- | --- |
| Node.js | 20+ | [nodejs.org](https://nodejs.org/) or your package manager |
| One npm-compatible tool | npm 10+, Yarn Classic 1.x, Yarn Berry 4.x, or pnpm 9/10 | Install the tool using its own documentation |

Choose one package manager for a checkout and use it consistently. Yarn Berry
does not require `corepack enable` when Yarn Berry is already installed. Yarn
Classic, npm, and pnpm use their own workspace and lockfile formats; do not
commit a second manager's lockfile.

### macOS and Linux

```bash
git clone https://github.com/limetrydev/limetry.git
cd limetry
```

Install and build with your chosen tool:

```bash
# npm
npm install
npm run build:sdk
npm run build:preflight
npm run build:server
npm run build:cli

# Yarn Classic 1.x or Yarn Berry 4.x
yarn install
yarn build:sdk
yarn build:preflight
yarn build:server
yarn build:cli

# pnpm
pnpm install
pnpm build:sdk
pnpm build:preflight
pnpm build:server
pnpm build:cli
```

Run the CLI:

```bash
node packages/cli/dist/index.js --help
```

### Windows

Limetry builds on Windows with Node.js 20+ and any supported package manager.
Use PowerShell or Git Bash:

```powershell
git clone https://github.com/limetrydev/limetry.git
cd limetry
```

Then use the equivalent install and build commands above with `npm`, `yarn`, or
`pnpm`. For example:

```powershell
npm install
npm run build:sdk
npm run build:preflight
npm run build:server
npm run build:cli
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
# npm
npm run release

# Yarn Classic, Yarn Berry, or pnpm
yarn release
pnpm release
```

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

### Install once published

```bash
npm install -g @limetry/cli
npx @limetry/cli setup

npm install @limetry/sdk

npx -y @limetry/mcp
```

Until the packages resolve on the npm registry, use the source instructions above.

## Docker (Server)

Build and run the governance server without a local Node toolchain:

```bash
docker build -f packages/server/Dockerfile -t limetry-server .
docker run --rm -p 3810:3810 \
  -e LIMETRY_BEARER_TOKEN=your-secure-bearer-token \
  -e DECISION_HMAC_SECRET=your-decision-hmac-secret-min-32-chars \
  limetry-server
```

See [USAGE.md](USAGE.md), `.env.example`, and `.env.production.example` for production environment
requirements (`USE_POSTGRES_STORE=true`, unique `JWT_SECRET` / `LIMETRY_BEARER_TOKEN` /
`DECISION_HMAC_SECRET`, and a non-loopback `DATABASE_URL`). Pulumi injects those keys from stack
secrets — see [packages/infra/README.md](packages/infra/README.md).

## Distribution Roadmap

1. **npm publish** (`@limetry/sdk`, `@limetry/cli`, `@limetry/mcp`, `@limetry/preflight`,
  `@limetry/ci`, `@limetry/shopify`, `@limetry/sql`, `@limetry/ui`) — workflows are in place.
2. **GitHub Release binaries** — self-contained CLI executables (macOS arm64/x64, Linux arm64/x64,
   Windows x64) built with Node SEA.
3. **Homebrew** — `brew install limetrydev/tap/limetry`, wrapping the release artifacts.
4. **Windows package managers** — winget and Scoop manifests referencing the release binaries.
5. **Linux packages** — deb/rpm via nfpm if operator demand warrants it.

Each channel is added to this page — and only to this page — when it actually works.
