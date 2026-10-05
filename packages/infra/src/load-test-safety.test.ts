import assert from "node:assert/strict"
import test from "node:test"

import {
  assertLoadTestDatabaseUrl,
  assertLoadTestStackSafety,
} from "./load-test-safety.js"

test("allows an isolated target stack with an unprotected hostname", () => {
  assert.doesNotThrow(() => assertLoadTestStackSafety({
    apiHostname: "api.load-test.example.com",
    domain: "load-test.example.com",
    isLoadTestApiOnly: true,
    stackName: "load-target-limetry-run",
  }))
})

test("rejects protected stack names", () => {
  assert.throws(
    () => assertLoadTestStackSafety({
      apiHostname: "api.load-test.example.com",
      domain: "load-test.example.com",
      isLoadTestApiOnly: true,
      stackName: "prod",
    }),
    /protected Pulumi stack/,
  )
})

test("rejects production hostnames", () => {
  assert.throws(
    () => assertLoadTestStackSafety({
      apiHostname: "api.limetry.org",
      domain: "load-test.example.com",
      isLoadTestApiOnly: true,
      stackName: "load-target-limetry-run",
    }),
    /protected hostname/,
  )
})

test("rejects a protected database host", () => {
  assert.throws(
    () => assertLoadTestDatabaseUrl(
      "postgresql://runner:secret@prod-db.example.com/load_test",
      ["prod-db.example.com"],
    ),
    /protected database host/,
  )
})
