import assert from "node:assert/strict"
import { describe, it } from "node:test"

describe("isLaunchOpen", () => {
  it("opens when NEXT_PUBLIC_IS_CLOUD_ENABLED is true", async () => {
    process.env.NEXT_PUBLIC_IS_CLOUD_ENABLED = "true"
    process.env.NEXT_PUBLIC_LAUNCHING_SOON = "false"
    const { isLaunchOpen } = await import("./launching-soon.js")
    assert.equal(isLaunchOpen(), true)
    delete process.env.NEXT_PUBLIC_IS_CLOUD_ENABLED
    delete process.env.NEXT_PUBLIC_LAUNCHING_SOON
  })

  it("opens when NEXT_PUBLIC_LAUNCHING_SOON is true", async () => {
    process.env.NEXT_PUBLIC_IS_CLOUD_ENABLED = "false"
    process.env.NEXT_PUBLIC_LAUNCHING_SOON = "true"
    const { isLaunchOpen } = await import("./launching-soon.js")
    assert.equal(isLaunchOpen(), true)
    delete process.env.NEXT_PUBLIC_IS_CLOUD_ENABLED
    delete process.env.NEXT_PUBLIC_LAUNCHING_SOON
  })
})
