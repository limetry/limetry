/**
 * Governance CLI commands: policy apply, eval, approvals, audit tail, and doctor.
 *
 * All API commands read `~/.limetry/config.json` (`baseUrl`, `apiKey`, optional `tenantId`).
 * Side effects: HTTP calls to the configured Limetry server; several commands exit non-zero
 * on failure. Does not write config except indirectly via shared helpers elsewhere.
 */

import { randomUUID } from "node:crypto"

import { type ActionIntent, type ActionPolicy, createSlimActionPolicy } from "@limetry/sdk"
import chalk from "chalk"

import { type CliConfig, getConfig, logError, logInfo, logSuccess } from "../../utils/config.js"

/**
 * Ensures setup has produced a usable `baseUrl` and `apiKey`.
 *
 * Side effects: prints an error and exits with code 1 when config is incomplete.
 *
 * @returns Loaded {@link CliConfig} with `baseUrl` and `apiKey`.
 */
function requireApiConfig(): CliConfig {
  const config = getConfig()
  if (!config?.baseUrl || !config?.apiKey) {
    logError("Not configured. Run `limetry setup` first.")
    process.exit(1)
  }
  return config
}

/**
 * Authenticated JSON request against the configured Limetry API.
 *
 * @param config - CLI config providing `baseUrl` and Bearer `apiKey`.
 * @param method - HTTP method.
 * @param path - API path beginning with `/`.
 * @param body - Optional JSON-serializable request body.
 * @returns HTTP status and parsed JSON body (empty object when body is non-JSON).
 */
async function apiRequest(
  config: CliConfig,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; json: unknown }> {
  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}${path}`, {
    method,
    headers: {
      "Authorization": `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json = await response.json().catch(() => ({}))
  return { status: response.status, json }
}

/**
 * Reads the entire stdin stream as UTF-8.
 *
 * @returns Concatenated stdin contents.
 */
function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    process.stdin.on("data", (chunk: Buffer) => chunks.push(chunk))
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
    process.stdin.on("error", reject)
  })
}

/**
 * Upserts an ActionPolicy (`limetry policy apply`).
 *
 * Options: `--file` (full JSON), or slim flags `--agent-id`, `--allow`, `--deny`,
 * `--block-resource`, `--max-cost`. Uses `config.tenantId` (default `"default"`).
 *
 * Side effects: `PUT /v1/policies/{policy_id}`; prints response JSON; exits 1 on HTTP ≥ 400.
 *
 * @param options - File path or slim policy construction flags from Commander.
 * @returns Resolves when the policy is applied successfully.
 */
export async function policyApplyCommand(options: {
  file?: string
  agentId?: string
  allow?: string[]
  deny?: string[]
  blockResource?: string[]
  maxCost?: string
}): Promise<void> {
  const config = requireApiConfig()
  let policy: ActionPolicy

  if (options.file) {
    const { readFileSync } = await import("node:fs")
    policy = JSON.parse(readFileSync(options.file, "utf8")) as ActionPolicy
  } else {
    const allowed = options.allow ?? ["http_get"]
    policy = createSlimActionPolicy({
      agentId: options.agentId ?? "default_agent",
      organizationId: config.tenantId ?? "default",
      allowedActionTypes: allowed,
      deniedActionTypes: options.deny,
      blockedResourcePatterns: options.blockResource,
      maxCostMinor: options.maxCost ? Number(options.maxCost) : undefined,
    })
  }

  const { status, json } = await apiRequest(
    config,
    "PUT",
    `/v1/policies/${policy.policy_id}`,
    { tenant_id: config.tenantId ?? "default", policy },
  )

  if (status >= 400) {
    logError(`Policy apply failed (${status}): ${JSON.stringify(json)}`)
    process.exit(1)
  }

  logSuccess(`Applied policy ${policy.policy_id}`)
  console.log(JSON.stringify(json, null, 2))
}

/**
 * Evaluates an ActionIntent (`limetry eval`).
 *
 * Options: `--file` path, or piped stdin when not a TTY. Body posts to
 * `POST /v1/policy/evaluate` with `tenant_id` from config.
 *
 * Side effects: API call; prints allow/deny/approval decision and JSON; exits 1 on errors.
 *
 * @param options - Optional path to ActionIntent JSON.
 * @returns Resolves when evaluation completes.
 */
export async function evalCommand(options: { file?: string }): Promise<void> {
  const config = requireApiConfig()
  let raw: string

  if (options.file) {
    const { readFileSync } = await import("node:fs")
    raw = readFileSync(options.file, "utf8")
  } else if (!process.stdin.isTTY) {
    raw = await readStdin()
  } else {
    logError("Provide ActionIntent JSON via --file or stdin")
    process.exit(1)
  }

  const parsed = JSON.parse(raw) as ActionIntent | { intent: ActionIntent; policy_id?: string }
  const intent = "intent" in parsed && parsed.intent ? parsed.intent : parsed as ActionIntent
  const policyId = ("policy_id" in parsed && typeof parsed.policy_id === "string"
    ? parsed.policy_id
    : intent.policy_id)

  const body = {
    tenant_id: config.tenantId ?? "default",
    policy_id: policyId,
    intent: {
      ...intent,
      intent_id: intent.intent_id || randomUUID(),
      policy_id: policyId,
      issued_at: intent.issued_at || new Date().toISOString(),
    },
  }

  const { status, json } = await apiRequest(config, "POST", "/v1/policy/evaluate", body)
  if (status >= 400) {
    logError(`Evaluate failed (${status}): ${JSON.stringify(json)}`)
    process.exit(1)
  }

  const result = json as {
    approved?: boolean
    decision?: string
    reasons?: string[]
    approval_id?: string
  }
  const decision = result.decision ?? (result.approved ? "allow" : "deny")
  if (decision === "allow") {
    logSuccess(`ALLOW ${intent.action_type} → ${intent.resource}`)
  } else if (decision === "approval_required") {
    console.log(chalk.yellow(
      `APPROVAL_REQUIRED ${intent.action_type} → ${intent.resource}` +
        (result.approval_id ? ` (${result.approval_id})` : ""),
    ))
  } else {
    console.log(chalk.yellow(`DENY ${intent.action_type} → ${intent.resource}`))
  }
  if (result.reasons?.length) {
    for (const reason of result.reasons) {
      console.log(chalk.dim(`  - ${reason}`))
    }
  }
  console.log(JSON.stringify(json, null, 2))
}

/**
 * Lists approvals (`limetry approvals list`).
 *
 * Options: `--status` (`pending` | `approved` | `denied` | `all`, default `pending`).
 *
 * Side effects: `GET /v1/approvals?status=...`; prints JSON; exits 1 on HTTP ≥ 400.
 *
 * @param options - Status filter from Commander.
 * @returns Resolves when the list is printed.
 */
export async function approvalsListCommand(options: {
  status?: string
}): Promise<void> {
  const config = requireApiConfig()
  const params = new URLSearchParams()
  params.set("status", options.status ?? "pending")
  const { status, json } = await apiRequest(
    config,
    "GET",
    `/v1/approvals?${params.toString()}`,
  )
  if (status >= 400) {
    logError(`Approvals list failed (${status}): ${JSON.stringify(json)}`)
    process.exit(1)
  }
  console.log(JSON.stringify(json, null, 2))
}

/**
 * Approves or denies a pending approval (`limetry approvals approve|deny`).
 *
 * Options: `approvalId`, `decision`, optional `--reviewer`, optional `--intent-file`
 * (exact ActionIntent JSON for approve payload-hash checks).
 *
 * Side effects: `POST /v1/approvals/{id}/approve|deny`; prints JSON; exits 1 on failure.
 *
 * @param options - Approval id, decision, and optional reviewer/intent binding.
 * @returns Resolves when the decision is recorded.
 */
export async function approvalsResolveCommand(options: {
  approvalId: string
  decision: "approve" | "deny"
  reviewer?: string
  intentFile?: string
}): Promise<void> {
  const config = requireApiConfig()
  let intent: ActionIntent | undefined
  if (options.intentFile) {
    const { readFileSync } = await import("node:fs")
    intent = JSON.parse(readFileSync(options.intentFile, "utf8")) as ActionIntent
  }
  const path = options.decision === "approve"
    ? `/v1/approvals/${options.approvalId}/approve`
    : `/v1/approvals/${options.approvalId}/deny`
  const { status, json } = await apiRequest(config, "POST", path, {
    reviewer: options.reviewer ?? "cli-operator",
    intent,
  })
  if (status >= 400) {
    logError(`Approval ${options.decision} failed (${status}): ${JSON.stringify(json)}`)
    process.exit(1)
  }
  logSuccess(`Approval ${options.approvalId} ${options.decision}d`)
  console.log(JSON.stringify(json, null, 2))
}

/**
 * Lists recent audit events (`limetry audit tail`).
 *
 * Options: `--limit` (default `"20"`), `--event-type`, `--agent-id`.
 *
 * Side effects: `GET /v1/audit?...`; prints JSON; exits 1 on HTTP ≥ 400.
 *
 * @param options - Query filters from Commander.
 * @returns Resolves when events are printed.
 */
export async function auditTailCommand(options: {
  limit?: string
  eventType?: string
  agentId?: string
}): Promise<void> {
  const config = requireApiConfig()
  const params = new URLSearchParams()
  params.set("limit", options.limit ?? "20")
  if (options.eventType) params.set("event_type", options.eventType)
  if (options.agentId) params.set("agent_id", options.agentId)

  const { status, json } = await apiRequest(config, "GET", `/v1/audit?${params.toString()}`)
  if (status >= 400) {
    logError(`Audit query failed (${status}): ${JSON.stringify(json)}`)
    process.exit(1)
  }

  console.log(JSON.stringify(json, null, 2))
}

/**
 * Checks local config, server health, and authenticated API access (`limetry doctor`).
 *
 * Reads `~/.limetry/config.json`. Calls `GET /health` (no auth) and `GET /v1/policies`
 * with the configured API key.
 *
 * Side effects: network probes; exits 1 when config, health, or auth fails.
 *
 * @returns Resolves when all doctor checks pass.
 */
export async function doctorCommand(): Promise<void> {
  const config = getConfig()
  console.log()
  console.log(chalk.bold("  Limetry doctor"))
  console.log()

  if (!config?.baseUrl || !config?.apiKey) {
    logError("No ~/.limetry/config.json — run `limetry setup`")
    process.exit(1)
  }

  logInfo(`Config: ${config.baseUrl}`)
  const healthUrl = `${config.baseUrl.replace(/\/$/, "")}/health`

  try {
    const health = await fetch(healthUrl, { signal: AbortSignal.timeout(5000) })
    if (!health.ok) {
      logError(`Health check failed: HTTP ${health.status}`)
      process.exit(1)
    }
    logSuccess("Server health OK")
  } catch (error) {
    logError(`Cannot reach ${healthUrl}: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }

  const { status, json } = await apiRequest(config, "GET", "/v1/policies")
  if (status === 401) {
    logError("API key rejected (401). Check LIMETRY_BEARER_TOKEN / config apiKey.")
    process.exit(1)
  }
  if (status >= 400) {
    logError(`Policies endpoint failed (${status}): ${JSON.stringify(json)}`)
    process.exit(1)
  }

  logSuccess("Authenticated API access OK")
  logSuccess("Doctor checks passed")
  console.log()
}
