#!/usr/bin/env node
/**
 * Limetry CLI entrypoint (`\@limetry/cli`).
 *
 * Registers Commander commands for setup, auth, policy, eval, approvals, audit,
 * and token management. Parses `process.argv` and exits via Commander.
 *
 * @packageDocumentation
 */

import { APP_VERSION } from "@limetry/sdk"
import { Command } from "commander"

import { loginCommand } from "./commands/auth/login.js"
import {
  approvalsListCommand,
  approvalsResolveCommand,
  auditTailCommand,
  doctorCommand,
  evalCommand,
  policyApplyCommand,
} from "./commands/governance/index.js"
import { setupCommand } from "./commands/setup/index.js"
import { tokenCreateCommand } from "./commands/token/create.js"
import { tokenListCommand } from "./commands/token/list.js"
import { tokenRevokeCommand } from "./commands/token/revoke.js"
import { tokenScopeCommand } from "./commands/token/scope.js"
import { installCliErrorHandlers } from "./utils/errors.js"

installCliErrorHandlers()

const program = new Command()

program
  .name("limetry")
  .description("Limetry CLI — agent action governance and telemetry")
  .version(APP_VERSION)

program
  .command("setup")
  .description("Interactive setup — local server or hosted API key")
  .action(setupCommand)

program
  .command("doctor")
  .description("Check config, server health, and API auth")
  .action(doctorCommand)

program
  .command("login")
  .description("Authenticate with Limetry (JWT)")
  .action(loginCommand)

const policyCmd = program.command("policy")
policyCmd.description("Manage action policies")

policyCmd
  .command("apply")
  .description("Upsert an ActionPolicy from flags or a JSON file")
  .option("-f, --file <path>", "Path to ActionPolicy JSON")
  .option("--agent-id <id>", "Agent id for slim policy")
  .option("--allow <types...>", "Allowed action types")
  .option("--deny <types...>", "Denied action types")
  .option("--block-resource <patterns...>", "Blocked resource patterns")
  .option("--max-cost <minor>", "Max cost in minor units")
  .action(policyApplyCommand)

program
  .command("eval")
  .description("Evaluate an ActionIntent JSON from --file or stdin")
  .option("-f, --file <path>", "Path to ActionIntent JSON")
  .action(evalCommand)

const approvalsCmd = program.command("approvals")
approvalsCmd.description("List and resolve pending approvals")

approvalsCmd
  .command("list")
  .description("List approvals")
  .option("--status <status>", "pending | approved | denied | all", "pending")
  .action(approvalsListCommand)

approvalsCmd
  .command("approve")
  .description("Approve a pending approval (optionally re-bind intent JSON)")
  .argument("<approvalId>", "Approval id")
  .option("--reviewer <name>", "Reviewer identity")
  .option("-f, --intent-file <path>", "Exact ActionIntent JSON for payload-hash check")
  .action((approvalId: string, options: { reviewer?: string; intentFile?: string }) =>
    approvalsResolveCommand({
      approvalId,
      decision: "approve",
      reviewer: options.reviewer,
      intentFile: options.intentFile,
    }))

approvalsCmd
  .command("deny")
  .description("Deny a pending approval")
  .argument("<approvalId>", "Approval id")
  .option("--reviewer <name>", "Reviewer identity")
  .action((approvalId: string, options: { reviewer?: string }) =>
    approvalsResolveCommand({
      approvalId,
      decision: "deny",
      reviewer: options.reviewer,
    }))

const auditCmd = program.command("audit")
auditCmd.description("Query audit / telemetry events")

auditCmd
  .command("tail")
  .description("List recent audit events")
  .option("-n, --limit <count>", "Number of events", "20")
  .option("--event-type <type>", "Filter by event type")
  .option("--agent-id <id>", "Filter by agent id")
  .action(auditTailCommand)

const tokenCmd = program.command("token")
tokenCmd.description("Manage access tokens")

tokenCmd
  .command("create")
  .description("Create a new access token")
  .option("-n, --name <name>", "Token name")
  .option("-s, --scopes <scopes...>", "Token scopes")
  .option("-e, --expires <date>", "Expiration date")
  .action(tokenCreateCommand)

tokenCmd
  .command("list")
  .description("List your access tokens")
  .action(tokenListCommand)

tokenCmd
  .command("revoke")
  .description("Revoke an access token")
  .argument("<tokenId>", "Token ID to revoke")
  .action(tokenRevokeCommand)

tokenCmd
  .command("scope <action>")
  .description("Manage token scopes")
  .action(tokenScopeCommand)

program.parse()
