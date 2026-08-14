# GitHub Actions + Copilot coding-agent CI gate

This example wires **GitHub Copilot coding agent** (and any Cursor agent running in CI) through
Limetry **before** deploy secrets exist. It is not a prompt-only guard: the agent must call
`run_ci_privilege` / `request_production_deploy` in `src/coding-agent.ts`.

Live gate on `limetry/limetry` (no LLM in the loop):

- `.github/workflows/limetry-ci-gate.yml` — allow `ci_privilege`, deny `deploy`
- `.github/workflows/deploy-infra.yml` — allow `deploy` on trusted events before AWS

Copy [`coding-agent-workflow.yml`](./coding-agent-workflow.yml), [`SKILL.md`](./SKILL.md), and
[`copilot-instructions.md`](./copilot-instructions.md) into a repo that uses Copilot coding agent.

## Decisions

| Agent action | Event | Decision | What happens |
| --- | --- | --- | --- |
| Copilot runs typecheck | `pull_request` | **allow** `ci_privilege` | Tests run. No deploy secrets. |
| Copilot requests production deploy | `pull_request` / fork | **deny** `deploy` | Fast-fail. Evaluate is not called. |
| Copilot requests production deploy | `push` to `main` | **approval_required** | Job exits closed with `approval_id`. |

`@limetry/ci` binds intents as `owner/repo@sha` and classifies `pull_request` as untrusted for deploy.

## Agent integration

```typescript
import { dispatchCodingAgentTool } from "./src/coding-agent.js"

const result = await dispatchCodingAgentTool(githubContext, "request_production_deploy")
if (result.decision !== "allow") {
  throw new Error(result.reasons.join("; "))
}
```

The model never receives AWS keys. GitHub Actions injects secrets only after `allow`.

## Apply the policy

```bash
limetry setup
limetry policy apply --file packages/ci/policies/ci-privilege.json
limetry policy apply --file packages/ci/policies/deploy.json
```

The example policy (`src/policy.ts`) adds `require_approval_action_types: ["deploy"]` so trusted
main deploys wait for an operator.

## Tests

```bash
yarn workspace @examples/github-actions-ci-gate test
```
