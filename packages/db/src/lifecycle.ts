/**
 * Creates or drops the open-source Limetry database.
 *
 * Postgres creates or drops `DATABASE_SCHEMA_NAME`, then pushes the Drizzle
 * schema. SQLite pushes into `SQLITE_DATABASE_PATH` or deletes that file.
 * Remote Postgres is refused unless `ALLOW_DB_DESTROY=true`.
 *
 * Usage: `tsx src/lifecycle.ts setup|destroy`
 */

import { spawnSync } from "node:child_process"
import { mkdirSync, rmSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, isAbsolute, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import dotenvx from "@dotenvx/dotenvx"
import { Client } from "pg"

import {
  assertDestroyAllowed,
  readDatabaseSchemaName,
  resolveDatabaseDialect,
} from "./schema-name.js"

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..")
const repoRoot = join(packageRoot, "../..")

/**
 * Expands a leading `~` in a SQLite path.
 *
 * @param value - Configured path.
 * @returns An absolute or relative path without a tilde prefix.
 */
function expandHome(value: string): string {
  if (value === "~") {
    return homedir()
  }
  if (value.startsWith("~/")) {
    return join(homedir(), value.slice(2))
  }
  return value
}

/**
 * Resolves the SQLite file used by setup and destroy.
 *
 * @returns Absolute filesystem path, or null for an in-memory database.
 */
function sqliteFilePath(): string | null {
  const configured = process.env.SQLITE_DATABASE_PATH?.trim() || "~/.limetry/limetry.sqlite"
  if (configured === ":memory:") {
    return null
  }
  const expanded = expandHome(configured)
  return isAbsolute(expanded) ? expanded : resolve(repoRoot, expanded)
}

/**
 * Runs drizzle-kit push for one dialect config.
 *
 * @param configFile - Config filename inside this package.
 * @returns Nothing.
 * @throws Error When drizzle-kit exits non-zero.
 */
function pushSchema(configFile: string): void {
  const push = spawnSync(
    "yarn",
    ["exec", "drizzle-kit", "push", "--force", "--config", configFile],
    {
      cwd: packageRoot,
      stdio: "inherit",
      env: process.env,
    },
  )
  if (push.status !== 0) {
    throw new Error("drizzle-kit push failed")
  }
}

/**
 * Creates the Postgres schema and pushes tables into it.
 *
 * @param schema - Validated schema name.
 * @param databaseUrl - `DATABASE_URL`.
 * @returns Nothing.
 */
async function setupPostgres(schema: string, databaseUrl: string): Promise<void> {
  const client = new Client({ connectionString: databaseUrl })
  await client.connect()
  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`)
  } finally {
    await client.end()
  }
  pushSchema("drizzle.postgres.config.ts")
  console.log(`Created Postgres schema ${schema}`)
}

/**
 * Drops the Postgres schema and every object inside it.
 *
 * @param schema - Validated schema name.
 * @param databaseUrl - `DATABASE_URL`.
 * @returns Nothing.
 */
async function destroyPostgres(schema: string, databaseUrl: string): Promise<void> {
  assertDestroyAllowed(schema, databaseUrl, process.env.ALLOW_DB_DESTROY)
  const client = new Client({ connectionString: databaseUrl })
  await client.connect()
  try {
    await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`)
  } finally {
    await client.end()
  }
  console.log(`Dropped Postgres schema ${schema}`)
}

/**
 * Creates the SQLite file and pushes tables into it.
 *
 * @returns Nothing.
 */
function setupSqlite(): void {
  const filePath = sqliteFilePath()
  if (!filePath) {
    console.log("SQLite :memory: databases are created by the server process")
    return
  }
  mkdirSync(dirname(filePath), { recursive: true })
  process.env.SQLITE_DATABASE_PATH = filePath
  pushSchema("drizzle.sqlite.config.ts")
  console.log(`Created SQLite database ${filePath}`)
}

/**
 * Deletes the configured SQLite file and its journal sidecars.
 *
 * @returns Nothing.
 */
function destroySqlite(): void {
  const filePath = sqliteFilePath()
  if (!filePath) {
    console.log("SQLite :memory: databases have nothing to delete")
    return
  }
  for (const suffix of ["", "-wal", "-shm"]) {
    rmSync(`${filePath}${suffix}`, { force: true })
  }
  console.log(`Deleted SQLite database ${filePath}`)
}

/**
 * Loads repo env and runs setup or destroy for the selected dialect.
 *
 * @returns Nothing.
 */
async function main(): Promise<void> {
  const command = process.argv[2]
  dotenvx.config({
    path: repoRoot,
    convention: "nextjs",
    quiet: true,
  })

  const dialect = resolveDatabaseDialect()
  const schema = readDatabaseSchemaName()

  if (command === "setup" && dialect === "postgresql") {
    const databaseUrl = process.env.DATABASE_URL?.trim()
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set")
    }
    await setupPostgres(schema, databaseUrl)
    return
  }
  if (command === "destroy" && dialect === "postgresql") {
    const databaseUrl = process.env.DATABASE_URL?.trim()
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set")
    }
    await destroyPostgres(schema, databaseUrl)
    return
  }
  if (command === "setup" && dialect === "sqlite") {
    setupSqlite()
    return
  }
  if (command === "destroy" && dialect === "sqlite") {
    destroySqlite()
    return
  }
  throw new Error("Usage: tsx src/lifecycle.ts setup|destroy")
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exit(1)
})
