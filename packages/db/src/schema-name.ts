/**
 * Database identifier helpers for the open-source Limetry stores.
 *
 * Postgres uses `DATABASE_SCHEMA_NAME` (default `evaluate`). SQLite has no
 * schemas, so setup ignores the name and uses `SQLITE_DATABASE_PATH`.
 */

const SCHEMA_NAME_PATTERN = /^[a-z_][a-z0-9_]*$/

const BLOCKED_SCHEMAS = new Set(["public", "pg_catalog", "information_schema"])

/**
 * Postgres or SQLite, chosen by `DATABASE_DIALECT` or `USE_POSTGRES_STORE`.
 */
export type DatabaseDialect = "postgresql" | "sqlite"

/**
 * Reads and validates `DATABASE_SCHEMA_NAME`.
 *
 * @param source - Env bag. Defaults to `process.env`.
 * @param fallback - Identifier used when the variable is missing or blank.
 * @returns A safe unqualified schema name.
 * @throws Error When the name is not a lowercase identifier.
 */
export function readDatabaseSchemaName(
  source: NodeJS.ProcessEnv = process.env,
  fallback = "evaluate",
): string {
  const raw = source.DATABASE_SCHEMA_NAME?.trim() || fallback
  if (!SCHEMA_NAME_PATTERN.test(raw)) {
    throw new Error(`Invalid DATABASE_SCHEMA_NAME: ${raw}`)
  }
  return raw
}

/**
 * Chooses the Drizzle dialect for setup and destroy.
 *
 * `DATABASE_DIALECT=sqlite|postgresql` wins. Otherwise
 * `USE_POSTGRES_STORE=true` selects Postgres and every other value selects SQLite.
 *
 * @param source - Env bag. Defaults to `process.env`.
 * @returns The dialect to operate on.
 * @throws Error When `DATABASE_DIALECT` is not a known value.
 */
export function resolveDatabaseDialect(
  source: NodeJS.ProcessEnv = process.env,
): DatabaseDialect {
  const explicit = source.DATABASE_DIALECT?.trim().toLowerCase()
  if (explicit === "postgresql" || explicit === "postgres") {
    return "postgresql"
  }
  if (explicit === "sqlite") {
    return "sqlite"
  }
  if (explicit) {
    throw new Error(`Invalid DATABASE_DIALECT: ${explicit}`)
  }
  return source.USE_POSTGRES_STORE === "true" ? "postgresql" : "sqlite"
}

/**
 * Returns true when a Postgres URL points at the local machine.
 *
 * @param value - `DATABASE_URL`.
 * @returns Whether the host is loopback. Parse failures are not loopback.
 */
export function isLoopbackDatabaseUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname
    return host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]"
  } catch {
    return false
  }
}

/**
 * Refuses to drop protected schemas or a remote database without an override.
 *
 * @param schema - Validated schema name.
 * @param databaseUrl - Connection string about to be modified.
 * @param allowDestroy - `ALLOW_DB_DESTROY` value.
 * @returns Nothing.
 * @throws Error When the target is protected or remote.
 */
export function assertDestroyAllowed(
  schema: string,
  databaseUrl: string,
  allowDestroy: string | undefined,
): void {
  if (BLOCKED_SCHEMAS.has(schema)) {
    throw new Error(`Refusing to drop Postgres schema: ${schema}`)
  }
  if (allowDestroy === "true") {
    return
  }
  if (!isLoopbackDatabaseUrl(databaseUrl)) {
    throw new Error("Refusing to destroy a non-local database. Set ALLOW_DB_DESTROY=true to override.")
  }
}
