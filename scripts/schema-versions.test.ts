import { describe, expect, it } from "vitest"

import {
  buildCompatibility,
  fingerprintContents,
  planSchemaVersion,
  productCompatibleRange,
  SCHEMA_BASELINE,
  schemaCompatibleRange,
  setOpenApiYamlVersion,
} from "./schema-versions.js"

const OPENAPI = `openapi: 3.1.0
info:
  title: Example
  version: 9.9.9
paths: {}
`

describe("schema versions", () => {
  it("adopts 1.0.0 the first time a schema is tracked", () => {
    const plan = planSchemaVersion({
      id: "openapi.evaluate",
      kind: "openapi-yaml",
      contents: OPENAPI,
      version: null,
      previousFingerprint: null,
      bump: "patch",
    })

    expect(plan.version).toBe(SCHEMA_BASELINE)
    expect(plan.contents).toContain("version: 1.0.0")
    expect(plan.changed).toBe(true)
  })

  it("keeps the schema version when only the version field would change", () => {
    const adopted = planSchemaVersion({
      id: "openapi.evaluate",
      kind: "openapi-yaml",
      contents: OPENAPI,
      version: null,
      previousFingerprint: null,
      bump: "patch",
    })
    const again = planSchemaVersion({
      id: "openapi.evaluate",
      kind: "openapi-yaml",
      contents: adopted.contents,
      version: adopted.version,
      previousFingerprint: adopted.fingerprint,
      bump: "major",
    })

    expect(again.version).toBe("1.0.0")
    expect(again.changed).toBe(false)
    expect(again.fingerprint).toBe(fingerprintContents(OPENAPI, "openapi-yaml"))
  })

  it("bumps only after the schema content changes", () => {
    const adopted = planSchemaVersion({
      id: "json.evaluate",
      kind: "text",
      contents: "export const shape = 1\n",
      version: null,
      previousFingerprint: null,
      bump: "patch",
    })
    const changed = planSchemaVersion({
      id: "json.evaluate",
      kind: "text",
      contents: "export const shape = 2\n",
      version: adopted.version,
      previousFingerprint: adopted.fingerprint,
      bump: "minor",
    })

    expect(changed.version).toBe("1.1.0")
    expect(changed.changed).toBe(true)
  })

  it("publishes product ranges separately from schema ranges", () => {
    expect(productCompatibleRange("1.2.46")).toBe(">=1.2.0 <1.3.0")
    expect(schemaCompatibleRange("1.0.0")).toBe(">=1.0.0 <2.0.0")
    expect(setOpenApiYamlVersion(OPENAPI, "1.0.0")).toContain("version: 1.0.0")

    const document = buildCompatibility({
      product: "1.2.46",
      packages: ["@limetry/sdk"],
      websites: ["oss", "cloud"],
      schemas: [{ id: "openapi.evaluate", version: "1.0.0", fingerprint: "abc" }],
    })

    expect(document.product).toBe("1.2.46")
    expect(document.compatibleProduct).toBe(">=1.2.0 <1.3.0")
    expect(document.packages["@limetry/sdk"]).toEqual({
      version: "1.2.46",
      compatible: ">=1.2.0 <1.3.0",
    })
    expect(document.websites.cloud.version).toBe("1.2.46")
    expect(document.schemas["openapi.evaluate"].compatible).toBe(">=1.0.0 <2.0.0")
  })
})
