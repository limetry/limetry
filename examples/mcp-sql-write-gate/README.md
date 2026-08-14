# SQL write gate — Cursor / Claude DB tool

This example is how **Cursor** and **Claude Desktop** should talk to Postgres or
Supabase: MCP tool `limetry_sql_query`, owned by `@limetry/sql`.

It is **not** a DBA console, Supabase SQL editor, or `psql` session. The model
never receives `DATABASE_URL`. Point `DATABASE_URL` or `SUPABASE_DB_URL` at any
Postgres (including Supabase) inside the MCP process.

## Decisions

| Agent asks | SQL class | Decision |
| --- | --- | --- |
| "Show recent users" `SELECT …` | `sql.read` | **allow** and execute |
| "Drop customers" `DROP TABLE …` | `sql.ddl` | **deny** before Postgres |
| "Insert a user" `INSERT …` | `sql.write` | **approval_required** — listed by `limetry_sql_list_pending` |

Copy:

- [`cursor-mcp.json`](./cursor-mcp.json) → `.cursor/mcp.json`
- [`claude_desktop_config.json`](./claude_desktop_config.json) → Claude Desktop config
- [`SKILL.md`](./SKILL.md) → agent instructions

```typescript
import { setupDemoGate } from "./src/gate-demo.js"
import { runAgentSqlQuery } from "./src/cursor-db-tool.js"

const gate = setupDemoGate({ apiKey, fetch })
const result = await runAgentSqlQuery(gate, "SELECT 1 AS ok")
```

## Live demo (no Supabase marketplace app)

[`.github/workflows/limetry-sql-gate.yml`](../../.github/workflows/limetry-sql-gate.yml)
runs Postgres in GitHub Actions, allows `SELECT 1`, and denies `DROP` / `DELETE`
before execute. This example policy additionally requires approval for `sql.write`
so INSERT is not a silent execute.

## Tests

```bash
yarn workspace @examples/mcp-sql-write-gate test
```
