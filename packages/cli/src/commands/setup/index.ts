/**
 * Interactive `limetry setup` wizard for self-hosted or cloud API credentials.
 *
 * Side effects: writes `~/.limetry/config.json`, probes `/health`,
 * and may `process.exit(1)` on connectivity failure.
 */

import {
  DEFAULT_LIMETRY_BASE_URL,
  DEFAULT_LIMETRY_CLOUD_BASE_URL,
  LIMETRY_CLOUD_APP_ORIGIN,
  resolveLimetryCloudBaseUrl,
} from "@limetry/sdk"
import chalk from "chalk"
import { mkdirSync, writeFileSync } from "fs"
import inquirer from "inquirer"
import { homedir } from "os"
import { dirname, join } from "path"

import { logError, logInfo, logSuccess } from "../../utils/config.js"

const CONFIG_PATH = join(homedir(), ".limetry", "config.json")

type SetupTarget = "oss" | "cloud"

/**
 * Probes `{baseUrl}/health` with a Bearer API key.
 *
 * @param baseUrl - API origin to check.
 * @param apiKey - Bearer token sent as `Authorization`.
 * @returns `true` when the health response is HTTP 2xx within 5s.
 */
async function checkConnectivity(baseUrl: string, apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/health`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Creates `~/.limetry` if needed and writes `{ baseUrl, apiKey }` config.
 *
 * @param baseUrl - API base URL to store.
 * @param apiKey - API key / bearer token to store.
 * @returns Nothing.
 */
function writeConfig(baseUrl: string, apiKey: string): void {
  const dir = dirname(CONFIG_PATH)
  mkdirSync(dir, { recursive: true })
  writeFileSync(CONFIG_PATH, JSON.stringify({ baseUrl, apiKey }, null, 2), "utf-8")
}

/**
 * Runs the interactive setup wizard (`limetry setup`).
 *
 * @returns Resolves when setup completes successfully.
 */
export async function setupCommand(): Promise<void> {
  console.log()
  console.log(chalk.bold("  Limetry — Setup Wizard"))
  console.log(chalk.dim("  Govern sensitive agent tool calls in under 5 minutes.\n"))

  const { target } = await inquirer.prompt<{ target: SetupTarget }>([
    {
      type: "list",
      name: "target",
      message: "Which API will this CLI use?",
      choices: [
        {
          name: `Limetry Cloud (organization) — ${DEFAULT_LIMETRY_CLOUD_BASE_URL}`,
          value: "cloud",
        },
        {
          name: `Self-hosted / OSS API — ${DEFAULT_LIMETRY_BASE_URL}`,
          value: "oss",
        },
      ],
      default: "cloud",
    },
  ])

  const defaultUrl =
    target === "cloud"
      ? resolveLimetryCloudBaseUrl()
      : DEFAULT_LIMETRY_BASE_URL

  if (target === "cloud") {
    console.log()
    console.log(chalk.dim(`  Portal: ${LIMETRY_CLOUD_APP_ORIGIN}`))
    console.log(chalk.dim(`  Sign up → ${LIMETRY_CLOUD_APP_ORIGIN}/sign-up`))
    console.log(chalk.dim(`  Agent token → ${LIMETRY_CLOUD_APP_ORIGIN}/tokens/create`))
    console.log(chalk.dim(`  Onboarding checklist → ${LIMETRY_CLOUD_APP_ORIGIN}/connect\n`))
  }

  const { url } = await inquirer.prompt([
    {
      type: "input",
      name: "url",
      message: "Evaluation API base URL:",
      default: defaultUrl,
      validate: (input: string) => {
        try {
          new URL(input)
          return true
        } catch {
          return `Enter a valid URL (e.g. ${defaultUrl})`
        }
      },
    },
  ])

  const tokenMessage =
    target === "cloud"
      ? "Organization agent token (from portal → Tokens):"
      : "Bearer token (LIMETRY_BEARER_TOKEN):"

  const { key } = await inquirer.prompt([
    {
      type: "password",
      name: "key",
      message: tokenMessage,
      mask: "*",
      validate: (input: string) =>
        input.trim().length >= 16 || "Token must be at least 16 characters",
    },
  ])

  const baseUrl = url.trim().replace(/\/$/, "")
  const apiKey = key.trim()

  process.stdout.write("\n")
  process.stdout.write(chalk.dim("  Checking connectivity..."))
  const ok = await checkConnectivity(baseUrl, apiKey)

  if (!ok) {
    process.stdout.write(chalk.red(" ✗\n\n"))
    logError(`Could not connect to ${baseUrl}`)
    if (target === "cloud") {
      logInfo(`Create a scoped token at ${LIMETRY_CLOUD_APP_ORIGIN}/tokens/create, then run \`limetry setup\` again.`)
    } else {
      logInfo("Check your URL and bearer token, then run `limetry setup` again.")
    }
    process.exit(1)
  }

  process.stdout.write(chalk.green(" ✓\n\n"))
  writeConfig(baseUrl, apiKey)
  logSuccess(`Connected to ${baseUrl}`)
  logSuccess(`Saved to ${CONFIG_PATH}`)

  console.log()
  console.log(chalk.bold("  Next steps (quickstart):\n"))
  console.log(chalk.dim("  1. limetry policy apply --allow http_get --deny http_post --block-resource https://prod.example.com/*"))
  console.log(chalk.dim("  2. echo '{...ActionIntent...}' | limetry eval"))
  console.log(chalk.dim("  3. limetry audit tail"))
  console.log(chalk.dim("  4. Or add MCP: npx -y @limetry/mcp with LIMETRY_BASE_URL + LIMETRY_API_KEY\n"))
  console.log(chalk.dim("  Docs: https://limetry.org/docs/quick-start"))
  console.log()
}
