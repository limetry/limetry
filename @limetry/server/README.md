[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../README.md)

***

[Limetry](../../README.md) / @limetry/server

# @limetry/server

Local long-running entry for `\@limetry/server`.

Loads monorepo dotenv, validates env via loadEnv, then binds the
Express app with startServer. Deployed Vercel and Lambda entrypoints
live in `packages/server/index.ts` and handler respectively.
