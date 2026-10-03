[**Limetry v1.2.55**](../../README.md)

***

[Limetry](../../README.md) / @limetry/sql

# `@limetry/sql`

> [!NOTE]
> **Origin:** A Cursor user asked Claude to clean up test data in their Supabase project. The
> generated `DELETE` matched far more rows than intended because the agent held `DATABASE_URL`
> directly. `@limetry/sql` owns the connection string instead: it classifies each statement,
> evaluates an ActionIntent, and only executes what the policy allows.

Postgres / Supabase write gate that **owns** `DATABASE_URL` and evaluates SQL intents with Limetry
before execute. Agents never receive write credentials from this package.

There is no Supabase Marketplace app. Point `DATABASE_URL` (or `SUPABASE_DB_URL`) at any Postgres,
including a Supabase project, then evaluate `sql.read` / `sql.write` / `sql.ddl` before the
driver runs.

## Live demo in this repo

[`.github/workflows/limetry-sql-gate.yml`](../../_media/limetry-sql-gate.yml)
starts Postgres 16 plus a Limetry node, applies [`policies/postgres.json`](../../_media/postgres.json),
then:

1. Evaluates `SELECT 1 AS ok` — must **allow** and **execute** on the job's Postgres.
2. Evaluates `DROP TABLE customers` — must **deny** (`sql.ddl`) before Postgres is touched.
3. Evaluates `DELETE FROM customers` — must **deny** (`sql.write`) before Postgres is touched.

Customers copy that policy and run the same gate in-process or as MCP against their own
Supabase connection string.

## Install

```bash
npm install @limetry/sql @limetry/sdk @modelcontextprotocol/sdk pg
```

Use the package manager you prefer; the equivalent Yarn or pnpm command works
the same way.

## MCP

```json
{
  "mcpServers": {
    "limetry-sql": {
      "command": "npx",
      "args": ["-y", "@limetry/sql"],
      "env": {
        "DATABASE_URL": "postgresql://...",
        "LIMETRY_API_KEY": "...",
        "LIMETRY_POLICY_ID": "...",
        "LIMETRY_BASE_URL": "http://localhost:3810",
        "LIMETRY_SQL_DRY_RUN": "true"
      }
    }
  }
}
```

Tools:

- `limetry_sql_query` — classify → evaluate → optional execute
- `limetry_sql_list_pending` — statements that returned `approval_required`

Classification is a conservative keyword heuristic (`read` / `write` / `ddl` / `unknown`).
Statements that do not classify cleanly map to `sql.write`, so the failure mode is
over-gating rather than an unguarded write. Postgres-compatible connection strings only.

> [!WARNING]
> `LIMETRY_SQL_DRY_RUN` defaults to dry-run (on unless explicitly `"false"`). Set it to
> `"false"` to let allowed reads actually execute.

## Apply the repo policy on your evaluation server

```bash
limetry setup
limetry policy apply --file packages/sql/policies/postgres.json
```

`policies/postgres.json` is read-only by design: `sql.write` and `sql.ddl` are denied
outright, with no approval path. To use `limetry_sql_list_pending`, add those types to
`require_approval_action_types` in your own policy.

SQL classification and Postgres action gating (`\@limetry/sql`).

Classifies statements, evaluates ActionIntents remotely, and optionally
executes allowed queries while keeping connection credentials private.

## Classes

- [SqlActionGate](classes/SqlActionGate.md)

## Type Aliases

- [SqlClass](type-aliases/SqlClass.md)
- [SqlGateOptions](type-aliases/SqlGateOptions.md)
- [SqlGateResult](type-aliases/SqlGateResult.md)

## Functions

- [actionTypeForSqlClass](functions/actionTypeForSqlClass.md)
- [classifySql](functions/classifySql.md)
