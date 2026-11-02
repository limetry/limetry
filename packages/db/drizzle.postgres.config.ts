import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import dotenvx from "@dotenvx/dotenvx"
import { defineConfig } from "drizzle-kit"

import { readDatabaseSchemaName } from "./src/schema-name.ts"

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..")

dotenvx.config({
  path: repoRoot,
  convention: "nextjs",
  quiet: true,
})

const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set")
}

export default defineConfig({
  schema: "./src/postgres/schema.ts",
  out: "./migrations/postgres",
  dialect: "postgresql",
  schemaFilter: [readDatabaseSchemaName()],
  dbCredentials: {
    url: databaseUrl,
  },
})
