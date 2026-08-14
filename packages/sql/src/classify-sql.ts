/**
 * Conservative SQL statement classification heuristics for action gating.
 */

/**
 * Coarse SQL statement class used to select a Limetry `action_type`.
 */
export type SqlClass = "read" | "write" | "ddl" | "unknown"

/**
 * Leading tokens classified as read queries.
 */
const READ_PREFIXES = ["select", "with", "show", "explain", "values"]

/**
 * Leading tokens classified as DDL (schema / privilege) statements.
 */
const DDL_PREFIXES = [
  "create",
  "alter",
  "drop",
  "truncate",
  "rename",
  "comment",
  "grant",
  "revoke",
]

/**
 * Leading tokens classified as write / DML statements.
 */
const WRITE_PREFIXES = [
  "insert",
  "update",
  "delete",
  "merge",
  "upsert",
  "copy",
  "call",
  "do",
]

/**
 * Classify a SQL statement with a conservative keyword heuristic.
 * Not a full parser — treat unknown as write-gated.
 *
 * Strips block and line comments, then inspects the first token.
 *
 * @param sql - Raw SQL text to classify.
 * @returns `"read"`, `"write"`, `"ddl"`, or `"unknown"` (empty / unrecognized).
 */
export function classifySql(sql: string): SqlClass {
  const normalized = sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ")
    .trim()
    .toLowerCase()

  if (!normalized) {
    return "unknown"
  }

  const firstToken = normalized.split(/\s+/)[0] ?? ""
  if (READ_PREFIXES.includes(firstToken)) {
    return "read"
  }
  if (DDL_PREFIXES.includes(firstToken)) {
    return "ddl"
  }
  if (WRITE_PREFIXES.includes(firstToken)) {
    return "write"
  }
  return "unknown"
}

/**
 * Map a SQL class onto Limetry action_type values.
 *
 * Unknown classes map to `sql.write` so they remain gated.
 *
 * @param sqlClass - Classification from {@link classifySql}.
 * @returns `sql.read`, `sql.ddl`, or `sql.write`.
 */
export function actionTypeForSqlClass(sqlClass: SqlClass): string {
  if (sqlClass === "read") {
    return "sql.read"
  }
  if (sqlClass === "ddl") {
    return "sql.ddl"
  }
  if (sqlClass === "write") {
    return "sql.write"
  }
  return "sql.write"
}
