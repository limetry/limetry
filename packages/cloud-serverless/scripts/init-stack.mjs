#!/usr/bin/env node

import { execFileSync } from "node:child_process"

const args = process.argv.slice(2)
const stackName = args[0]

if (!stackName || stackName.startsWith("-")) {
  console.error("Usage: yarn init:stack <stack-name> [cloud-provider] [location]")
  process.exit(1)
}

const cloudProvider = args[1] ?? "aws"
const location = args[2] ?? {
  aws: "us-east-1",
  gcp: "us-central1",
  azure: "westus2",
}[cloudProvider]

if (!location) {
  console.error(`Unsupported cloud provider "${cloudProvider}"`)
  process.exit(1)
}

const runPulumi = (pulumiArgs) => {
  execFileSync("pulumi", pulumiArgs, {
    cwd: process.cwd(),
    stdio: "inherit",
  })
}

runPulumi(["stack", "init", stackName])

const config = [
  ["cloudProvider", cloudProvider],
  ["location", location],
  ["databaseProvider", "sqlite"],
  ["manageDns", "false"],
  ["dnsProvider", "native"],
  ["minInstances", "0"],
  ["maxInstances", "1"],
]

for (const [key, value] of config) {
  runPulumi(["config", "set", key, value])
}

if (cloudProvider === "aws") {
  runPulumi(["config", "set", "aws:region", location])
}

console.log("")
console.log(`Initialized ${stackName} with cloudProvider=${cloudProvider} and location=${location}`)
console.log("Set apiDomain, apiDomainZone, DNS, and database secrets before deploying.")
