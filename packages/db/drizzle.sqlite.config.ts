import { homedir } from "node:os"
import { isAbsolute, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import dotenvx from "@dotenvx/dotenvx"
import { defineConfig } from "drizzle-kit"

const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "../..")

dotenvx.config({
  path: repoRoot,
  convention: "nextjs",
  quiet: true,
})

/**
 * Expands a leading `~` and resolves the SQLite file for drizzle-kit.
 *
 * @param value - Configured path.
 * @returns Absolute filesystem path.
 */
function sqliteUrl(value: string): string {
  const expanded = value === "~"
    ? homedir()
    : value.startsWith("~/")
      ? join(homedir(), value.slice(2))
      : value
  return isAbsolute(expanded) ? expanded : resolve(repoRoot, expanded)
}

const configured = process.env.SQLITE_DATABASE_PATH?.trim() || "~/.limetry/limetry.sqlite"

export default defineConfig({
  schema: "./src/sqlite/schema.ts",
  out: "./migrations/sqlite",
  dialect: "sqlite",
  dbCredentials: {
    url: sqliteUrl(configured),
  },
})
