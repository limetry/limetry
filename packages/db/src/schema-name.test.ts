import { describe, expect, it } from "vitest"

import {
  assertDestroyAllowed,
  isLoopbackDatabaseUrl,
  readDatabaseSchemaName,
  resolveDatabaseDialect,
} from "./schema-name"

describe("readDatabaseSchemaName", () => {
  it("defaults to the evaluate schema", () => {
    expect(readDatabaseSchemaName({})).toBe("evaluate")
  })

  it("reads a configured schema name", () => {
    expect(readDatabaseSchemaName({ DATABASE_SCHEMA_NAME: "limetry_oss" })).toBe("limetry_oss")
  })

  it("rejects identifiers that are not safe in SQL", () => {
    expect(() => readDatabaseSchemaName({ DATABASE_SCHEMA_NAME: "evaluate;drop" })).toThrow(
      "Invalid DATABASE_SCHEMA_NAME",
    )
  })
})

describe("resolveDatabaseDialect", () => {
  it("uses SQLite unless Postgres is selected", () => {
    expect(resolveDatabaseDialect({})).toBe("sqlite")
    expect(resolveDatabaseDialect({ USE_POSTGRES_STORE: "false" })).toBe("sqlite")
    expect(resolveDatabaseDialect({ USE_POSTGRES_STORE: "true" })).toBe("postgresql")
  })

  it("lets DATABASE_DIALECT override the store flag", () => {
    expect(resolveDatabaseDialect({
      DATABASE_DIALECT: "sqlite",
      USE_POSTGRES_STORE: "true",
    })).toBe("sqlite")
    expect(resolveDatabaseDialect({ DATABASE_DIALECT: "postgres" })).toBe("postgresql")
  })

  it("rejects an unknown dialect", () => {
    expect(() => resolveDatabaseDialect({ DATABASE_DIALECT: "mysql" })).toThrow(
      "Invalid DATABASE_DIALECT",
    )
  })
})

describe("assertDestroyAllowed", () => {
  it("allows a loopback Postgres URL", () => {
    expect(isLoopbackDatabaseUrl("postgresql://localhost:5432/limetry")).toBe(true)
    expect(() => assertDestroyAllowed(
      "evaluate",
      "postgresql://localhost:5432/limetry",
      undefined,
    )).not.toThrow()
  })

  it("refuses public and remote databases", () => {
    expect(() => assertDestroyAllowed(
      "public",
      "postgresql://localhost:5432/limetry",
      "true",
    )).toThrow("Refusing to drop")
    expect(() => assertDestroyAllowed(
      "evaluate",
      "postgresql://limetry:limetry@db.example.com:5432/limetry",
      undefined,
    )).toThrow("ALLOW_DB_DESTROY")
  })
})
