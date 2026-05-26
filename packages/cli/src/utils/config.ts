/**
 * Local CLI config I/O, interactive prompts, and console logging helpers.
 *
 * Config path: `~/.limetry/config.json`.
 */

import chalk from "chalk"
import { readFileSync, writeFileSync } from "fs"
import inquirer from "inquirer"
import { homedir } from "os"
import { join } from "path"

const CONFIG_PATH = join(homedir(), ".limetry", "config.json")

/**
 * Persisted CLI credentials and API endpoint settings.
 */
export interface CliConfig {
  /**
   * Limetry API base URL (no trailing slash required).
   */
  baseUrl: string
  /**
   * Bearer API key / `LIMETRY_BEARER_TOKEN` used for API calls.
   */
  apiKey: string
  /**
   * JWT from `limetry login`, when authenticated via email/password.
   */
  jwtToken?: string
  /**
   * Tenant id returned by login or supplied for multi-tenant APIs.
   */
  tenantId?: string
  /**
   * Authenticated user id from login.
   */
  userId?: string
  /**
   * Authenticated user email from login.
   */
  email?: string
}

/**
 * Reads `~/.limetry/config.json` when present.
 *
 * @returns Parsed {@link CliConfig}, or `null` when missing or unreadable.
 */
export function getConfig(): CliConfig | null {
  try {
    const content = readFileSync(CONFIG_PATH, "utf-8")
    return JSON.parse(content)
  } catch {
    return null
  }
}

/**
 * Writes CLI config to `~/.limetry/config.json`.
 *
 * Side effects: overwrites the config file; logs to stderr on write failure.
 *
 * @param config - Full config object to persist.
 * @returns Nothing.
 */
export function saveConfig(config: CliConfig): void {
  try {
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
  } catch (error) {
    console.error("Failed to save config:", error)
  }
}

/**
 * Interactively prompts for an email address.
 *
 * @returns Validated email string from the user.
 */
export async function promptForEmail(): Promise<string> {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "email",
      message: "Enter your email:",
      validate: (input) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input) || "Invalid email"
      },
    },
  ])
  return answers.email
}

/**
 * Interactively prompts for a password (masked).
 *
 * @returns Password string from the user.
 */
export async function promptForPassword(): Promise<string> {
  const answers = await inquirer.prompt([
    {
      type: "password",
      name: "password",
      message: "Enter your password:",
      mask: "*",
    },
  ])
  return answers.password
}

/**
 * Prints a green success line to stdout.
 *
 * @param message - Message body after the checkmark.
 * @returns Nothing.
 */
export function logSuccess(message: string): void {
  console.log(chalk.green(`✓ ${message}`))
}

/**
 * Prints a red error line to stderr.
 *
 * @param message - Message body after the cross mark.
 * @returns Nothing.
 */
export function logError(message: string): void {
  console.error(chalk.red(`✗ ${message}`))
}

/**
 * Prints a blue info line to stdout.
 *
 * @param message - Message body after the info mark.
 * @returns Nothing.
 */
export function logInfo(message: string): void {
  console.log(chalk.blue(`ℹ ${message}`))
}

/**
 * Loads config or exits the process when not authenticated.
 *
 * Side effects: prints an error and calls `process.exit(1)` when config is missing.
 *
 * @returns Loaded {@link CliConfig}.
 * @throws Never returns when unauthenticated; exits the process instead.
 */
export function requireAuth(): CliConfig {
  const config = getConfig()
  if (!config) {
    logError("Not authenticated. Run 'limetry login' first.")
    process.exit(1)
  }
  return config
}
