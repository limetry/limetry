# `@limetry/ci`

> [!NOTE]
> **Origin:** A fork PR shared a workflow with `configure-aws-credentials`. No token was
> stolen. Untrusted code and credential steps ran in the same job (`pull_request_target`
> shape). `@limetry/ci` evaluates `ci_privilege` and `deploy` intents against a policy
> *before* credentials load.

GitHub Action and library helpers that evaluate CI privilege and deploy intents with Limetry
before a workflow uses secrets, OIDC, or production deploy credentials.

This repository uses two action policies:

| File | Allow | Deny | Used by |
| --- | --- | --- | --- |
| [`policies/ci-privilege.json`](policies/ci-privilege.json) | `ci_privilege` | `deploy` | [`.github/workflows/limetry-ci-gate.yml`](../../.github/workflows/limetry-ci-gate.yml) |
| [`policies/deploy.json`](policies/deploy.json) | `ci_privilege`, `deploy` | — | [`.github/workflows/deploy-infra.yml`](../../.github/workflows/deploy-infra.yml) |

`ci_privilege` is the test/typecheck lane. `deploy` is Pulumi / production publish.
`@limetry/ci` classifies GitHub events against an explicit trusted allowlist (`push`,
`release`, `workflow_dispatch`). Pull-request, review, issue, and `workflow_run` events
are untrusted, and any event not on the allowlist — including `schedule` — is untrusted
by default. Deploy jobs set `require_trusted: true` so fork PRs fail before AWS
credentials are loaded.

## Live demo in this repo

[`.github/workflows/limetry-ci-gate.yml`](../../.github/workflows/limetry-ci-gate.yml)
starts a Limetry node in the job, applies `ci-privilege.json`, then:

1. Evaluates `ci_privilege` — must **allow** (tests may run).
2. Evaluates `deploy` — must **deny** and fail that step (`action_type deploy is denied`).

[`.github/workflows/deploy-infra.yml`](../../.github/workflows/deploy-infra.yml) applies
`deploy.json` and evaluates `deploy` with `require_trusted: true` **before**
`configure-aws-credentials`.

That workflow builds `@limetry/ci` from source. `dist/` is gitignored, so
`uses: limetry/limetry/packages/ci@main` cannot run `dist/run-action.js` from a raw checkout.

## Install

The composite action currently requires a source checkout because `dist/` is gitignored.
For drop-in use, reference the monorepo path:

```yaml
- uses: limetry/limetry/packages/ci@main
  with:
    limetry_api_key: ${{ secrets.LIMETRY_API_KEY }}
    limetry_base_url: ${{ vars.LIMETRY_BASE_URL }}
    policy_id: ${{ vars.LIMETRY_CI_POLICY_ID }}
    action_type: deploy
    require_trusted: "true"
```

## Apply the same rules on your evaluation server

```bash
limetry setup
limetry policy apply --file packages/ci/policies/ci-privilege.json
limetry policy apply --file packages/ci/policies/deploy.json
```

Then point a workflow at your Limetry node (see `packages/ci/examples/workflow.yml`).

`LIMETRY_CI_POLICY_ID` for production deploys is the `policy_id` inside `deploy.json`
(`22222222-2222-4222-8222-222222222222`) unless you apply a new UUID.

## Library

```ts
import { evaluateCiPrivilege, verifyReleaseReceipt } from "@limetry/ci"

const result = await evaluateCiPrivilege({
  apiKey: process.env.LIMETRY_API_KEY!,
  policyId: process.env.LIMETRY_POLICY_ID!,
  agentId: "github_actions",
  actionType: "deploy",
  repository: "limetry/limetry",
  sha: process.env.GITHUB_SHA!,
  eventName: "push",
})
```

The ActionIntent resource is `owner/repo@sha`. Policy evaluation stays in
`@limetry/sdk` / the Limetry server.

`evaluateCiPrivilege` resolves to `{ evaluation, intent, trust }`. Read the decision
from `result.evaluation.decision` and the event trust from `result.trust`.
