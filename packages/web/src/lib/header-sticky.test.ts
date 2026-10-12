import assert from "node:assert/strict"
import { describe, it } from "node:test"

describe("isHeaderSticky", () => {
  it("enables when NEXT_PUBLIC_IS_HEADER_STICKY is true", async () => {
    process.env.NEXT_PUBLIC_IS_HEADER_STICKY = "true"
    const { isHeaderSticky } = await import("./header-sticky.js")
    assert.equal(isHeaderSticky(), true)
    delete process.env.NEXT_PUBLIC_IS_HEADER_STICKY
  })

  it("disables when the flag is false", async () => {
    process.env.NEXT_PUBLIC_IS_HEADER_STICKY = "false"
    const { isHeaderSticky } = await import("./header-sticky.js")
    assert.equal(isHeaderSticky(), false)
    delete process.env.NEXT_PUBLIC_IS_HEADER_STICKY
  })
})
