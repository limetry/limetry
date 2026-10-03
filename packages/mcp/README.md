# `@limetry/mcp`

MCP server for Limetry **agent action governance**: evaluate ActionIntents, record outcomes,
list privacy-safe audit events, and upsert action policies.

## Quickstart

1. Run `npx -y @limetry/mcp` from your MCP host configuration.
2. Point the MCP host at the published package with `LIMETRY_API_KEY` and `LIMETRY_BASE_URL`.
3. Ask the agent to call `limetry_evaluate` before irreversible tool calls; enforce deny in the loop.
4. Call `limetry_record_action` after execute/skip/block.

> [!NOTE]
> Evaluate uses the **full** intent for policy matching. Audit stores a **privacy-safe record**
> (`audit_mode=minimal` by default). Do **not** put API keys, passwords, or chat transcripts in
> `metadata` / `details`. `limetry_record_action` runs client-side `redactDetails` before POST;
> the server also minimizes. See [Data minimization](https://limetry.org/docs/server/data-minimization).

## Tools

| Tool | Purpose |
| --- | --- |
| `limetry_evaluate` | Allow / deny / wait + reasons + signed receipt |
| `limetry_record_action` | Scrubbed `action.recorded` event |
| `limetry_list_audit` | List recent privacy-safe audit rows |
| `limetry_upsert_policy` | Create/update ActionPolicy (`auditMode` supported) |

## Run from source

For local development or unreleased changes, build from a checkout:

```bash
yarn build:sdk && yarn workspace @limetry/mcp build
node packages/mcp/dist/index.js
```

Cursor / Claude config example:

```json
{
  "mcpServers": {
    "limetry": {
      "command": "node",
      "args": ["/absolute/path/to/limetry/packages/mcp/dist/index.js"],
      "env": {
        "LIMETRY_BEARER_TOKEN": "your-bearer-token",
        "LIMETRY_BASE_URL": "http://localhost:3810"
      }
    }
  }
}
```

For normal use, prefer the published `npx -y @limetry/mcp` command above.
