import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { formatResourceName, projectAnomalyMonitorSpecification } from "./tags.js"

describe("tags", () => {
  it("formats resource names as project-resource-stack", () => {
    assert.equal(
      formatResourceName("limetry-cloud", "api-logs", "dev"),
      "limetry-cloud-api-logs-dev",
    )
    assert.equal(
      formatResourceName("limetry-oss", "web-cdn", "prod"),
      "limetry-oss-web-cdn-prod",
    )
  })

  it("rejects empty resource segments", () => {
    assert.throws(() => formatResourceName("limetry-cloud", "  ", "dev"))
  })

  it("documents SSM paths as /limetry/project/stack/param", () => {
    assert.equal(
      `/limetry/${"limetry-oss"}/${"dev"}/${"JWT_SECRET"}`,
      "/limetry/limetry-oss/dev/JWT_SECRET",
    )
  })

  it("builds CUSTOM anomaly monitor specification for a Project tag", () => {
    assert.equal(
      projectAnomalyMonitorSpecification("limetry-oss"),
      JSON.stringify({
        Tags: {
          Key: "Project",
          Values: ["limetry-oss"],
        },
      }),
    )
  })
})
