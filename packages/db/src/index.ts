/**
 * Public entry for `\@limetry/db`.
 *
 * Dialect schemas live on `./postgres` and `./sqlite` so a Postgres consumer
 * does not load the SQLite table graph.
 */

export type { DatabaseDialect } from "./schema-name.js"
export {
  assertDestroyAllowed,
  isLoopbackDatabaseUrl,
  readDatabaseSchemaName,
  resolveDatabaseDialect,
} from "./schema-name.js"
