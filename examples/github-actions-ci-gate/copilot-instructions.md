# Copilot coding agent — Limetry CI gate

You run inside GitHub Actions. Privileged secrets (AWS, Pulumi, production deploy keys)
are **not** available to you until Limetry returns `allow`.

## Required tool loop

1. For tests / typecheck, call `run_ci_privilege` (`src/coding-agent.ts`).
2. For production deploy, call `request_production_deploy`.
3. Honor the decision:

- `allow` — continue the job step.
- `deny` — fail the step with the returned reasons. Typical for fork PRs requesting deploy.
- `approval_required` — fail closed. Print `approval_id`. Do not deploy until an operator
  approves via the Limetry approval API.

## Do not

- Use `pull_request` / `pull_request_target` as a deploy trigger.
- Read or print repository secrets to "work around" a deny.
- Treat a successful typecheck as permission to deploy.
