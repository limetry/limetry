# Limetry agent skill

This folder packages the **Limetry agent skill** (`SKILL.md`) with scripts for
policy validation and local intent dry-runs.

Agents (Claude Code, Gemini, Cursor) use this skill to **evaluate tool-call
intents**, enforce deny outcomes, and avoid putting secrets into audit fields.

Limetry is agent **action governance** (evaluate → deny → privacy-safe audit). It
does not custody funds or run FROST/MPC signing.

## Folder structure

- `SKILL.md` — Core instructions for AI agents
- `README.md` — Installation and usage
- `scripts/validate_policy.mjs` — Validate policy JSON locally
- `scripts/evaluate_intent.mjs` — Dry-run evaluate intents under a policy
- `examples/` — Sample `ActionPolicy` + `ActionIntent` (minimal audit mode)

## Installation

Install from this source checkout. Publishing of Limetry packages to npm is
separate from this skill folder.

### Cursor

```bash
mkdir -p .agents/skills/
cp -r packages/limetry-skill .agents/skills/limetry
```

### Gemini

```bash
mkdir -p ~/.gemini/config/skills/
cp -r packages/limetry-skill ~/.gemini/config/skills/limetry
```

### Claude Desktop / Claude Code

Point the skill directory path at this folder in your workspace config.

## Usage

```bash
cd packages/limetry-skill
yarn install

node scripts/validate_policy.mjs --file examples/policy.json
node scripts/evaluate_intent.mjs --policy examples/policy.json --intent examples/intent.json
```

## Example files

### `examples/policy.json` (ActionPolicy)

```json
{
  "policy_id": "11111111-1111-4111-8111-111111111111",
  "version": 1,
  "organization_id": "org_demo",
  "agent_id": "demo_agent",
  "allowed_action_types": ["http_get"],
  "denied_action_types": ["http_post", "deploy", "delete"],
  "blocked_resource_patterns": ["https://prod.example.com/*"],
  "audit_mode": "minimal",
  "status": "active",
  "updated_at": "2026-07-27T00:00:00.000Z",
  "effective_from": "2026-07-27T00:00:00.000Z",
  "expires_at": null
}
```

### `examples/intent.json` (ActionIntent)

```json
{
  "intent_id": "22222222-2222-4222-8222-222222222222",
  "policy_id": "11111111-1111-4111-8111-111111111111",
  "agent_id": "demo_agent",
  "action_type": "http_post",
  "resource": "https://prod.example.com/deploy",
  "issued_at": "2026-07-27T12:00:00.000Z"
}
```

Send only fields needed for policy. Prefer `audit_mode: "minimal"`. Use SDK
helpers `redactActionIntent` / `redactDetails` for local logs; the server also
scrubs before audit storage. See `/docs/server/data-minimization`.
