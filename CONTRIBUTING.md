# Contributing to Limetry

Thanks for your interest in improving Limetry. This guide covers the development workflow, coding
standards, and how to get a change merged.

## Development Setup

Follow the source installation in [INSTALL.md](INSTALL.md), then verify your toolchain:

```bash
cargo test -p limetry-core -p limetry-ffi
yarn test:sdk
yarn test:server
yarn test:cli
```

## Repository Layout

| Path | Contents |
| --- | --- |
| `crates/limetry-core` | Policy evaluation, velocity/replay stores |
| `crates/limetry-ffi` | C ABI consumed by the Node SDK via koffi |
| `crates/limetry-wasm` | wasm-bindgen exports (evaluation only) |
| `packages/sdk` | TypeScript SDK (ActionIntent + optional payment helpers) |
| `packages/server` | Action governance + telemetry HTTP API |
| `packages/cli` | `limetry` CLI |
| `packages/mcp` | MCP server |
| `packages/web` | Website and documentation |
| `examples/` | Integration examples |

## Coding Standards

### TypeScript

- Double quotes, no semicolons, 2-space indentation, trailing commas on multiline literals
- No `any`; prefer narrow local types over type assertions
- No inline comments — comments go on the line above and explain intent, not mechanics
- Imports grouped and alphabetized (built-ins, external, aliases)
- Explicit return types on exported functions
- Run `yarn typecheck` in every workspace you touch before pushing

### Rust

- `cargo fmt` and `cargo clippy` clean
- Public APIs documented with rustdoc comments
- Edition 2024; MSRV 1.85

### Security-Sensitive Code

Changes to decision receipts (`decision-receipt.ts`), auth signing, bearer auth, or audit stores
receive extra scrutiny:

- Never log HMAC secrets, bearer tokens, or password hashes
- Prefer constant-time compares for secrets
- Do not reintroduce FROST/MPC/threshold key-shard custody

## Tests

Every behavioral change needs a test. Test descriptions start with a verb
(`it("rejects http_post when denied by policy")`). Aim to keep coverage at or above the current
baseline for touched packages.

## Pull Requests

- One logical change per PR when practical
- Update docs when you change public APIs (README, USAGE, website quick-start)
- Link related issues
