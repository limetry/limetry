[**Limetry v1.2.55**](../../README.md)

***

[Limetry](../../README.md) / @limetry/cli

# `@limetry/cli`

Command-line tool for Limetry agent action governance: setup, policy apply, evaluate, approval, audit, and token management.

## Install

```bash
npm install -g @limetry/cli
```

Use the package manager you prefer; the equivalent Yarn or pnpm command works
the same way.

Requires Node.js 20 or newer. The `limetry` command is the package bin.

## Setup

```bash
limetry setup
limetry doctor
```

`setup` writes local config for a self-hosted server or a hosted API token. `doctor` checks that config, server health, and auth.

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
limetry login
limetry token create --name ci --scopes read:rules
limetry token list
limetry token revoke <tokenId>
```

## License

MIT

Limetry CLI entrypoint (`\@limetry/cli`).

Registers Commander commands for setup, auth, policy, eval, approvals, audit,
and token management. Parses `process.argv` and exits via Commander.
