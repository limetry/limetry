---
name: limetry-cursor-claude-sql
description: >-
  Query Postgres or Supabase from Cursor or Claude using limetry_sql_query.
  Use this instead of a DBA console, psql, or the Supabase SQL editor.
---

# Cursor / Claude SQL tool (not a DBA console)

You are a coding agent with a **database query tool**, not a DBA.
You never receive `DATABASE_URL`. Call MCP tool `limetry_sql_query` only.

Do not open the Supabase dashboard SQL editor, `psql`, or a GUI console to
"just run it". Those paths skip Limetry.

## Tools

1. `limetry_sql_query` — classify → evaluate → optional execute.
2. `limetry_sql_list_pending` — statements waiting on operator approval.

Copy [`cursor-mcp.json`](./cursor-mcp.json) to `.cursor/mcp.json` or
[`claude_desktop_config.json`](./claude_desktop_config.json) into Claude Desktop.

## Decisions you must honor

| You wanted | SQL | Expected decision | What you do |
| --- | --- | --- | --- |
| Inspect rows | `SELECT id, email FROM users LIMIT 20` | `allow` `sql.read` | Use returned `rows`. |
| Wipe a table | `DROP TABLE customers` | `deny` `sql.ddl` | Stop. Quote reasons. |
| Insert a row | `INSERT INTO users (email) VALUES ('a@b.com')` | `approval_required` `sql.write` | Do not retry. Call `limetry_sql_list_pending` and wait. |

## Rules

- Prefer `SELECT` with `LIMIT`.
- Never concatenate user chat into SQL without showing the exact statement in the tool call.
- On `deny` or `approval_required`, `executed` is false — Postgres was not changed.
