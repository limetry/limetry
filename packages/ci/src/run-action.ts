#!/usr/bin/env node
/**
 * GitHub Action CLI entrypoint that evaluates CI privilege / deploy intents
 * and writes decision outputs for downstream workflow steps.
 */

import { appendFileSync } from "node:fs"

import { resolveLimetryBaseUrl } from "@limetry/sdk"

import { evaluateCiPrivilege } from "./evaluate.js"

/**
 * Parse a boolean env/input string with a fallback when unset or empty.
 *
 * @param value - Raw env value (`"true"` / `"1"` are truthy).
 * @param fallback - Value used when `value` is undefined or empty.
 * @returns Parsed boolean.
 */
function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") {
    return fallback
  }
  return value === "true" || value === "1"
}

/**
 * Write a GitHub Actions output, or print `name=value` to stdout when
 * `GITHUB_OUTPUT` is unset.
 *
 * @param name - Output name.
 * @param value - Output value.
 */
function setOutput(name: string, value: string): void {
  const destination = process.env.GITHUB_OUTPUT
  if (!destination) {
    process.stdout.write(`${name}=${value}\n`)
    return
  }
  appendFileSync(destination, `${name}=${value}\n`)
}

/**
 * GitHub Action entrypoint for Limetry CI privilege / deploy gating.
 *
 * Reads workflow inputs from `INPUT_*` / `LIMETRY_*` / `GITHUB_*` env vars,
 * evaluates via {@link evaluateCiPrivilege}, and sets `decision`, `decision_id`,
 * `approval_id`, and `receipt_digest` outputs.
 *
 * Exit codes:
 * - `0` — allow (or approval_required when `fail_on_approval_required` is false)
 * - `1` — missing inputs, untrusted event (when required), deny, or approval_required
 *
 * @param env - Process environment; defaults to `process.env`.
 * @returns Process exit code (`0` success, `1` failure).
 * @throws Propagates evaluation transport / remote errors to the caller.
 */
export async function runAction(env: NodeJS.ProcessEnv = process.env): Promise<number> {
  const eventName = env.GITHUB_EVENT_NAME ?? env.INPUT_EVENT_NAME ?? ""
  const sha = env.GITHUB_SHA ?? ""
  const repository = env.GITHUB_REPOSITORY ?? ""
  const ref = env.GITHUB_REF
  const apiKey = env.INPUT_LIMETRY_API_KEY ?? env.LIMETRY_API_KEY ?? ""
  const baseUrl = resolveLimetryBaseUrl(
    env,
    env.INPUT_LIMETRY_BASE_URL ?? env.LIMETRY_BASE_URL,
  )
  const policyId = env.INPUT_POLICY_ID ?? env.LIMETRY_POLICY_ID ?? ""
  const agentId = env.INPUT_AGENT_ID ?? "github_actions"
  const actionTypeRaw = env.INPUT_ACTION_TYPE ?? "ci_privilege"
  const actionType = actionTypeRaw === "deploy" ? "deploy" : "ci_privilege"
  const requireTrusted = readBoolean(env.INPUT_REQUIRE_TRUSTED, true)
  const failOnApprovalRequired = readBoolean(env.INPUT_FAIL_ON_APPROVAL_REQUIRED, true)

  if (!apiKey || !policyId || !repository || !sha || !eventName) {
    process.stderr.write(
      "Missing required CI inputs (api key, policy id, repository, sha, or event name)\n",
    )
    return 1
  }

  const result = await evaluateCiPrivilege({
    baseUrl,
    apiKey,
    policyId,
    agentId,
    actionType,
    repository,
    sha,
    eventName,
    ref,
  })

  setOutput("decision", result.evaluation.decision ?? "deny")
  setOutput("decision_id", result.evaluation.decision_id ?? "")
  setOutput("approval_id", result.evaluation.approval_id ?? "")
  const receipt = result.evaluation.receipt as { digest?: string } | undefined
  setOutput("receipt_digest", receipt?.digest ?? "")

  if (requireTrusted && result.trust === "untrusted") {
    process.stderr.write(
      `Refusing privileged CI for untrusted event ${eventName} on ${result.intent.resource}\n`,
    )
    return 1
  }

  if (result.evaluation.decision === "deny") {
    process.stderr.write(
      `Limetry denied ${actionType}: ${(result.evaluation.reasons ?? []).join("; ")}\n`,
    )
    return 1
  }

  if (result.evaluation.decision === "approval_required" && failOnApprovalRequired) {
    process.stderr.write(
      `Limetry requires approval (${result.evaluation.approval_id ?? "unknown"}): ` +
        `${(result.evaluation.reasons ?? []).join("; ")}\n`,
    )
    return 1
  }

  process.stdout.write(
    `Limetry ${result.evaluation.decision ?? "allow"} for ${result.intent.resource}\n`,
  )
  return 0
}

/**
 * True when this module is executed directly rather than imported.
 */
const isDirectRun =
  process.argv[1]?.endsWith("run-action.js") ||
  process.argv[1]?.endsWith("run-action.ts")

if (isDirectRun) {
  void runAction()
    .then((code) => {
      process.exit(code)
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      process.stderr.write(`${message}\n`)
      process.exit(1)
    })
}
