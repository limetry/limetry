# `@limetry/cli`

Command-line tool for Limetry agent action governance: setup, policy apply, evaluate, approval, audit, and token management.

## Install

```bash
npm install -g @limetry/cli
```

This installs the published CLI, so npm, pnpm, or a Yarn Berry one-off via
`yarn dlx @limetry/cli` are valid choices. If you cloned the repository, use
the root Yarn Berry instructions instead of installing from the workspace.

Requires Node.js 20 or newer. The `limetry` command is the package bin.

## Setup

```bash
limetry setup
limetry doctor
```

For Limetry Cloud, `setup` opens the portal in your browser. Sign in or create a
workspace with Clerk, approve the CLI request, and return to the terminal. The
CLI stores a short-lived access session and rotating refresh session in
`~/.limetry/config.json`; bearer tokens are never placed in the browser URL.

For a self-hosted OSS server, choose the OSS option and enter its bearer token.
Published CLI defaults are `https://api.app.limetry.com` for Cloud and
`https://api.limetry.org` for OSS.

The CLI reads its stored session automatically. To export compatible variables
for an external SDK or MCP process, use:

```bash
eval "$(limetry auth env)"
```

Use `limetry auth status` to inspect the session without printing secrets and
`limetry auth logout` to revoke the Cloud refresh session and remove local credentials.

## Policy, evaluate, approve

```bash
limetry policy apply --file policy.json
limetry eval --file intent.json
limetry approvals list
limetry approvals approve <approvalId> --reviewer you
limetry audit tail -n 20
```

`eval` prints `allow`, `deny`, or `approval_required` for an ActionIntent JSON file (or stdin). `policy apply` upserts an action policy from that JSON file, or from `--allow`, `--deny`, `--block-resource`, and `--max-cost`.

## Tokens

```bash
limetry auth login
limetry auth status
limetry auth logout
limetry token create --name ci --scopes read:rules
limetry token list
limetry token revoke <tokenId>
```

## License

MIT
