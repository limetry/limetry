#!/usr/bin/env node
/**
 * Local ActionPolicy / SpendingPolicy JSON validator for the Limetry agent skill.
 *
 * Reads a policy file from disk, checks required fields and types, and exits
 * non-zero when the document is structurally invalid. Prefer ActionPolicy
 * (`allowed_action_types`). Legacy SpendingPolicy (`limits`) remains supported
 * for archived spend demos only.
 *
 * @example
 * ```bash
 * node scripts/validate_policy.mjs --file examples/policy.json
 * ```
 */

import fs from "fs"
import minimist from "minimist"
import path from "path"

const args = minimist(process.argv.slice(2), {
  string: ["file"],
  alias: { f: "file", h: "help" },
  boolean: ["help"],
})

if (args.help || !args.file) {
  console.log(`
Usage: node validate_policy.mjs --file <path_to_policy_json>

Validates ActionPolicy (preferred) or legacy SpendingPolicy JSON.
`)
  process.exit(0)
}

const filePath = path.resolve(args.file)

if (!fs.existsSync(filePath)) {
  console.error(`Error: Policy file not found at ${filePath}`)
  process.exit(1)
}

let policy
try {
  policy = JSON.parse(fs.readFileSync(filePath, "utf8"))
} catch (err) {
  console.error(`Error: Failed to parse policy file as JSON. ${err.message}`)
  process.exit(1)
}

const errors = []

/**
 * Records a validation error when `field` is missing or null on `obj`.
 *
 * @param {Record<string, unknown>} obj - Object under validation.
 * @param {string} field - Property name that must be present.
 * @param {string} [parentName=""] - Dot-path prefix for nested fields.
 * @returns {boolean} `true` when the field is present.
 */
function assertRequired(obj, field, parentName = "") {
  const fullField = parentName ? `${parentName}.${field}` : field
  if (obj[field] === undefined || obj[field] === null) {
    errors.push(`Missing required field: '${fullField}'`)
    return false
  }
  return true
}

/**
 * Records a validation error when `field` exists but is not `expectedType`.
 *
 * @param {Record<string, unknown>} obj - Object under validation.
 * @param {string} field - Property name to type-check.
 * @param {string} expectedType - Result of `typeof` that must match.
 * @param {string} [parentName=""] - Dot-path prefix for nested fields.
 * @returns {void}
 */
function assertType(obj, field, expectedType, parentName = "") {
  if (!assertRequired(obj, field, parentName)) return
  const fullField = parentName ? `${parentName}.${field}` : field
  const actualType = typeof obj[field]
  if (actualType !== expectedType) {
    errors.push(`Invalid type for '${fullField}': expected '${expectedType}', got '${actualType}'`)
  }
}

const isActionPolicy = Array.isArray(policy.allowed_action_types)
const isSpendingPolicy = policy.limits !== undefined

assertRequired(policy, "policy_id")
assertRequired(policy, "version")
assertRequired(policy, "status")

if (policy.status && !["active", "suspended", "revoked"].includes(policy.status)) {
  errors.push("Invalid value for 'status': must be one of 'active', 'suspended', 'revoked'")
}

if (policy.audit_mode && !["minimal", "forensics"].includes(policy.audit_mode)) {
  errors.push("Invalid 'audit_mode': must be 'minimal' or 'forensics'")
}

if (isActionPolicy) {
  if (!Array.isArray(policy.allowed_action_types) || policy.allowed_action_types.length === 0) {
    errors.push("allowed_action_types must be a non-empty array")
  }
  assertRequired(policy, "agent_id")
  assertRequired(policy, "organization_id")
} else if (isSpendingPolicy) {
  const limits = policy.limits
  assertType(limits, "max_single_transaction_minor", "number", "limits")
  assertType(limits, "max_daily_spend_minor", "number", "limits")
  assertType(limits, "max_monthly_spend_minor", "number", "limits")
  assertType(limits, "currency", "string", "limits")
  if (assertRequired(policy, "velocity")) {
    assertType(policy.velocity, "max_transactions_per_minute", "number", "velocity")
  }
  if (assertRequired(policy, "replay")) {
    assertType(policy.replay, "nonce_window_seconds", "number", "replay")
  }
  if (assertRequired(policy, "isolation")) {
    assertType(policy.isolation, "max_concurrent_pending_intents", "number", "isolation")
  }
  if (assertRequired(policy, "destination_rules")) {
    assertType(policy.destination_rules, "require_merchant_allowlist", "boolean", "destination_rules")
  }
} else {
  errors.push("Policy must be an ActionPolicy (allowed_action_types) or SpendingPolicy (limits)")
}

if (policy.mpc !== undefined) {
  errors.push("Unsupported field 'mpc' — FROST/MPC is not part of Limetry; remove it")
}

if (errors.length > 0) {
  console.error("Policy validation failed:")
  errors.forEach((err) => console.error(`  - ${err}`))
  process.exit(1)
}

const kind = isActionPolicy ? "ActionPolicy" : "SpendingPolicy"
console.log(`${kind} at ${args.file} is structurally valid.`)
process.exit(0)
