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

describe("shouldScrollHideHeader", () => {
  it("keeps the header pinned on docs routes when sticky mode is on", async () => {
    process.env.NEXT_PUBLIC_IS_HEADER_STICKY = "true"
    const { shouldScrollHideHeader } = await import("./header-sticky.js")
    assert.equal(shouldScrollHideHeader("/docs"), false)
    assert.equal(shouldScrollHideHeader("/docs/server/architecture"), false)
    assert.equal(shouldScrollHideHeader("/"), true)
    assert.equal(shouldScrollHideHeader("/community"), true)
    delete process.env.NEXT_PUBLIC_IS_HEADER_STICKY
  })

  it("never scroll-hides when sticky mode is off", async () => {
    process.env.NEXT_PUBLIC_IS_HEADER_STICKY = "false"
    const { shouldScrollHideHeader } = await import("./header-sticky.js")
    assert.equal(shouldScrollHideHeader("/"), false)
    assert.equal(shouldScrollHideHeader("/docs/introduction"), false)
    delete process.env.NEXT_PUBLIC_IS_HEADER_STICKY
  })
})
