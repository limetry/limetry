#!/usr/bin/env node
/**
 * Offline dry-run evaluator for ActionIntent / legacy spend intents.
 *
 * Loads policy and intent JSON from disk, applies the same structural allow/deny
 * rules agents use locally (without calling a Limetry HTTP server), and prints a
 * JSON decision. Prefer ActionPolicy + ActionIntent. SpendingPolicy paths exist
 * for archived demos only.
 *
 * @example
 * ```bash
 * node scripts/evaluate_intent.mjs --policy examples/policy.json --intent examples/intent.json
 * ```
 */

import fs from "fs"
import minimist from "minimist"
import path from "path"

const args = minimist(process.argv.slice(2), {
  string: ["policy", "intent", "ledger"],
  alias: { p: "policy", i: "intent", l: "ledger", h: "help" },
  boolean: ["help"],
})

if (args.help || !args.policy || !args.intent) {
  console.log(`
Usage: node evaluate_intent.mjs --policy <policy_json> --intent <intent_json>

Dry-runs ActionIntent against ActionPolicy (preferred), or legacy spend intents
against SpendingPolicy.
`)
  process.exit(0)
}

/**
 * Reads and parses a JSON file, exiting the process on missing path or parse errors.
 *
 * @param {string} filePath - Relative or absolute path to a JSON document.
 * @param {string} label - Human-readable label used in error messages.
 * @returns {unknown} Parsed JSON value.
 */
function loadJson(filePath, label) {
  const resolved = path.resolve(filePath)
  if (!fs.existsSync(resolved)) {
    console.error(`Error: ${label} file not found at ${resolved}`)
    process.exit(1)
  }
  try {
    return JSON.parse(fs.readFileSync(resolved, "utf8"))
  } catch (err) {
    console.error(`Error: Failed to parse ${label} as JSON. ${err.message}`)
    process.exit(1)
  }
}

const policy = loadJson(args.policy, "Policy")
const intent = loadJson(args.intent, "Intent")
const violations = []

const isActionPolicy = Array.isArray(policy.allowed_action_types)

if (policy.status !== "active") {
  violations.push(`Policy is currently inactive (status: '${policy.status}')`)
}

if (isActionPolicy) {
  const actionType = intent.action_type
  const resource = intent.resource
  if (!actionType || !resource) {
    console.error("Error: ActionIntent requires action_type and resource")
    process.exit(1)
  }

  const denied = policy.denied_action_types ?? []
  if (denied.includes(actionType)) {
    violations.push(`Action type '${actionType}' is denied`)
  } else if (!policy.allowed_action_types.includes(actionType)) {
    violations.push(`Action type '${actionType}' is not in allowed_action_types`)
  }

  const blocked = policy.blocked_resource_patterns ?? []
  for (const pattern of blocked) {
    const prefix = pattern.endsWith("*") ? pattern.slice(0, -1) : pattern
    if (resource.startsWith(prefix) || resource === pattern) {
      violations.push(`Resource '${resource}' matches blocked pattern '${pattern}'`)
    }
  }

  const allowed = policy.allowed_resource_patterns
  if (Array.isArray(allowed) && allowed.length > 0) {
    const ok = allowed.some((pattern) => {
      const prefix = pattern.endsWith("*") ? pattern.slice(0, -1) : pattern
      return resource.startsWith(prefix) || resource === pattern
    })
    if (!ok) {
      violations.push(`Resource '${resource}' is not in allowed_resource_patterns`)
    }
  }
} else {
  const ledger = args.ledger
    ? loadJson(args.ledger, "Ledger")
    : { last_nonce: 0, daily_spent: 0, transactions_today: 0 }
  const merchantId = intent.payee?.merchant_id ?? intent.merchant_id
  const amountMinor = intent.amount?.amount_minor ?? intent.amount_minor
  const currency = intent.amount?.currency ?? intent.currency
  const nonce = intent.nonce

  if (!merchantId || amountMinor === undefined || !currency) {
    console.error("Error: Spend intent missing merchant_id / amount_minor / currency")
    process.exit(1)
  }

  if (currency !== policy.limits?.currency) {
    violations.push(`Currency mismatch: intent '${currency}' vs policy '${policy.limits?.currency}'`)
  }
  if (amountMinor > policy.limits?.max_single_transaction_minor) {
    violations.push("Single transaction limit exceeded")
  }
  if (policy.destination_rules?.blocked_merchant_ids?.includes(merchantId)) {
    violations.push(`Payee '${merchantId}' is blocked`)
  }
  if (policy.replay?.require_monotonic_nonce && nonce !== undefined && nonce <= ledger.last_nonce) {
    violations.push("Replay protection: nonce must increase")
  }
  if (ledger.daily_spent + amountMinor > policy.limits?.max_daily_spend_minor) {
    violations.push("Daily spending limit exceeded")
  }
}

if (violations.length > 0) {
  console.log(JSON.stringify({
    ok: false,
    decision: "deny",
    reasons: violations,
    audit_mode: policy.audit_mode ?? "minimal",
    evaluated_at: new Date().toISOString(),
  }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  decision: "allow",
  reasons: [],
  audit_mode: policy.audit_mode ?? "minimal",
  evaluated_at: new Date().toISOString(),
  intent_id: intent.intent_id ?? "unknown",
}, null, 2))
process.exit(0)
