/**
 * Interactive `limetry setup` wizard for self-hosted or cloud API credentials.
 *
 * Cloud deployments sign in through the browser and mint a CLI credential.
 * Self-hosted setups either paste `LIMETRY_BEARER_TOKEN` or, on this machine,
 * confirm in the browser and receive a new token. A pasted token is checked
 * against an authenticated route before it is saved.
 */

import {
  DEFAULT_LIMETRY_BASE_URL,
  DEFAULT_LIMETRY_CLOUD_BASE_URL,
  resolveLimetryCloudBaseUrl,
} from "@limetry/sdk"
import chalk from "chalk"
import { mkdirSync, writeFileSync } from "fs"
import inquirer from "inquirer"
import { homedir } from "os"
import { dirname, join } from "path"

import { logError, logInfo, logSuccess } from "../../utils/config.js"
import { clerkAuthProvider } from "../auth/browser.js"
import { createLocalCliToken } from "./local-token.js"
import {
  bearerProbeResult,
  classifyHealthBody,
  defaultCloudPortalUrl,
  isLoopbackBaseUrl,
} from "./probe.js"

const CONFIG_PATH = join(homedir(), ".limetry", "config.json")

type SetupTarget = "oss" | "cloud"
type OssCredential = "paste" | "browser"

/**
 * Loads `/health` and classifies the API.
 *
 * @param baseUrl - API origin.
 * @returns Product kind, or `unknown` when the server cannot be classified.
 */
async function probeApi(baseUrl: string): Promise<"oss" | "cloud" | "unknown" | "down"> {
  try {
    const response = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(5000) })
    if (!response.ok) {
      return "down"
    }
    return classifyHealthBody(await response.json())
  } catch {
    return "down"
  }
}

/**
 * Checks a bearer token against `GET /v1/rules`.
 *
 * `/health` is public, so it cannot tell a bad token from a good one.
 *
 * @param baseUrl - API origin.
 * @param apiKey - Bearer token.
 * @returns Probe result.
 */
async function verifyBearer(baseUrl: string, apiKey: string): Promise<"valid" | "invalid" | "unreachable"> {
  try {
    const response = await fetch(`${baseUrl}/v1/rules`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    })
    return bearerProbeResult(response.status)
  } catch {
    return "unreachable"
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
 * Runs browser sign-in against a Cloud API and portal pair.
 *
 * @param apiUrl - Cloud API origin.
 * @returns Nothing.
 */
async function setupCloud(apiUrl: string): Promise<void> {
  const portalDefault = defaultCloudPortalUrl(apiUrl)
  let portalUrl = portalDefault
  if (apiUrl.replace(/\/$/, "") !== DEFAULT_LIMETRY_CLOUD_BASE_URL) {
    const answer = await inquirer.prompt<{ portalUrl: string }>([
      {
        type: "input",
        name: "portalUrl",
        message: "Portal URL for browser sign-in:",
        default: portalDefault,
      },
    ])
    portalUrl = answer.portalUrl.trim()
  }
  console.log()
  console.log(chalk.dim(`  Portal: ${portalUrl}`))
  console.log(chalk.dim("  Sign in once in the browser. Limetry creates the CLI credential.\n"))
  await clerkAuthProvider.login(apiUrl, portalUrl)
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
      type: "select",
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

  const defaultUrl = target === "cloud"
    ? resolveLimetryCloudBaseUrl()
    : DEFAULT_LIMETRY_BASE_URL

  const { url } = await inquirer.prompt<{ url: string }>([
    {
      type: "input",
      name: "url",
      message: "API base URL:",
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

  const baseUrl = url.trim().replace(/\/$/, "")
  const kind = await probeApi(baseUrl)
  if (kind === "down") {
    logError(`Could not connect to ${baseUrl}`)
    logInfo("Start the API, then run `limetry setup` again.")
    process.exit(1)
  }

  if (target === "cloud" || kind === "cloud") {
    if (target === "oss" && kind === "cloud") {
      logInfo("This URL is Limetry Cloud. Browser sign-in creates the CLI credential.")
    }
    await setupCloud(baseUrl)
    return
  }

  const { credential } = await inquirer.prompt<{ credential: OssCredential }>([
    {
      type: "select",
      name: "credential",
      message: "How should the CLI authenticate?",
      choices: [
        {
          name: "Paste LIMETRY_BEARER_TOKEN from the server",
          value: "paste",
        },
        {
          name: "Create a token in the browser (this computer only)",
          value: "browser",
        },
      ],
      default: isLoopbackBaseUrl(baseUrl) ? "browser" : "paste",
    },
  ])

  if (credential === "browser") {
    if (!isLoopbackBaseUrl(baseUrl)) {
      logError("Browser token setup only works when the API is on this computer.")
      logInfo("Paste the server's LIMETRY_BEARER_TOKEN, or use Limetry Cloud sign-in.")
      process.exit(1)
    }
    const apiKey = await createLocalCliToken(baseUrl)
    writeConfig(baseUrl, apiKey)
    logSuccess(`Connected to ${baseUrl}`)
    logSuccess(`Saved to ${CONFIG_PATH}`)
    printNextSteps()
    return
  }

  const { key } = await inquirer.prompt<{ key: string }>([
    {
      type: "password",
      name: "key",
      message: "Bearer token (LIMETRY_BEARER_TOKEN):",
      mask: "*",
      validate: (input: string) =>
        input.trim().length >= 16 || "Token must be at least 16 characters",
    },
  ])

  const apiKey = key.trim()
  process.stdout.write("\n")
  process.stdout.write(chalk.dim("  Checking bearer token..."))
  const probe = await verifyBearer(baseUrl, apiKey)
  if (probe !== "valid") {
    process.stdout.write(chalk.red(" ✗\n\n"))
    logError(probe === "invalid"
      ? "The bearer token was rejected."
      : `Could not verify the bearer token at ${baseUrl}`)
    logInfo("Nothing was saved. Check the token, then run `limetry setup` again.")
    process.exit(1)
  }

  process.stdout.write(chalk.green(" ✓\n\n"))
  writeConfig(baseUrl, apiKey)
  logSuccess(`Connected to ${baseUrl}`)
  logSuccess(`Saved to ${CONFIG_PATH}`)
  printNextSteps()
}

/**
 * Prints the quickstart commands after a successful OSS setup.
 *
 * @returns Nothing.
 */
function printNextSteps(): void {
  console.log()
  console.log(chalk.bold("  Next steps (quickstart):\n"))
  console.log(chalk.dim("  1. limetry policy apply --allow http_get --deny http_post --block-resource https://prod.example.com/*"))
  console.log(chalk.dim("  2. echo '{...ActionIntent...}' | limetry eval"))
  console.log(chalk.dim("  3. limetry audit tail"))
  console.log(chalk.dim("  4. Or add MCP: npx -y @limetry/mcp with LIMETRY_BASE_URL + LIMETRY_API_KEY\n"))
  console.log(chalk.dim("  Docs: https://limetry.org/docs/quick-start"))
  console.log()
}
