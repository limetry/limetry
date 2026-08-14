---
name: limetry-github-actions-ci-gate
description: >-
  Gate GitHub Copilot coding-agent and GitHub Actions jobs with Limetry.
  Use when proposing tests, typecheck, or production deploys.
---

# Limetry CI gate for Copilot coding agents

You are a GitHub Copilot / Cursor coding agent working in CI. You do **not** hold
deploy secrets. Call the governed tools in `src/coding-agent.ts` before any
privileged job step.

## Tools

1. `run_ci_privilege` — tests and typecheck (`ci_privilege`). Expected **allow** on PRs.
2. `request_production_deploy` — production deploy (`deploy`).

## Decisions you must honor

| Case | Tool | Expected decision | What you do |
| --- | --- | --- | --- |
| PR typecheck | `run_ci_privilege` | `allow` | Run tests. Do not deploy. |
| Fork / pull_request deploy | `request_production_deploy` | `deny` | Stop. Report the reasons. Never use AWS/Pulumi secrets. |
| Push to main | `request_production_deploy` | `approval_required` | Do not deploy. Surface `approval_id` to the operator. |

## Rules

- Never skip evaluate because the model is "sure" the SHA is safe.
- Never request deploy from `pull_request` or `refs/pull/*`.
- On `deny` or `approval_required`, `executed` is false. Treat that as a hard stop.
