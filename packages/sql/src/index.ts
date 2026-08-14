/**
 * SQL classification and Postgres action gating (`\@limetry/sql`).
 *
 * Classifies statements, evaluates ActionIntents remotely, and optionally
 * executes allowed queries while keeping connection credentials private.
 *
 * @packageDocumentation
 */

export {
  actionTypeForSqlClass,
  classifySql,
  type SqlClass,
} from "./classify-sql.js"
export {
  SqlActionGate,
  type SqlGateOptions,
  type SqlGateResult,
} from "./gate.js"
