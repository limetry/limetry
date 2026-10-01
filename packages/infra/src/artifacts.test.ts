import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  type ArtifactBuildInputs,
  httpsOrigin,
  shouldBuildArtifacts,
  webPublicEnv,
} from "./artifacts"

const sampleInputs: ArtifactBuildInputs = {
  apiHostname: "api.dev.limetry.org",
  portalHostname: "app.dev.limetry.org",
  buildArtifacts: true,
  contactEmail: "hello@limetry.org",
  discordUrl: "https://discord.gg/VxUWz7cZP",
  domain: "dev.limetry.org",
  githubUrl: "https://github.com/limetry/limetry",
  legalEmail: "legal@limetry.org",
  privacyEmail: "privacy@limetry.org",
  serverArtifactPath: "../server/lambda-bundle",
  webDistPath: "../web/out",
}

describe("infra artifact helpers", () => {
  it("builds https origins from hostnames and urls", () => {
    assert.equal(httpsOrigin("api.dev.limetry.org"), "https://api.dev.limetry.org")
    assert.equal(httpsOrigin("https://limetry.org/"), "https://limetry.org")
  })

  it("bakes stack public URLs into the web export env", () => {
    const env = webPublicEnv(sampleInputs)
    assert.equal(env.LIMETRY_STATIC_EXPORT, "1")
    assert.equal(env.NEXT_PUBLIC_WEB_URL, "https://dev.limetry.org")
    assert.equal(env.NEXT_PUBLIC_API_URL, "https://api.dev.limetry.org")
    assert.equal(env.NEXT_PUBLIC_APP_URL, "https://app.dev.limetry.org")
    assert.equal(env.NEXT_PUBLIC_CONTACT_EMAIL, "hello@limetry.org")
  })

  it("bakes Sentry and PostHog into the web export env when configured", () => {
    const env = webPublicEnv({
      ...sampleInputs,
      sentryDsn: "https://abc@o1.ingest.sentry.io/1",
      posthogPublicProjectToken: "phc_example",
      posthogHost: "https://us.i.posthog.com",
    })
    assert.equal(env.NEXT_PUBLIC_SENTRY_DSN, "https://abc@o1.ingest.sentry.io/1")
    assert.equal(env.SENTRY_DSN, "https://abc@o1.ingest.sentry.io/1")
    assert.equal(env.NEXT_PUBLIC_POSTHOG_KEY, "phc_example")
    assert.equal(env.NEXT_PUBLIC_POSTHOG_HOST, "https://us.i.posthog.com")
  })

  it("builds when artifacts are missing even if the flag is off", () => {
    assert.equal(shouldBuildArtifacts({
      buildArtifacts: false,
      lambdaExists: false,
      skipEnv: undefined,
      webExists: true,
    }), true)
    assert.equal(shouldBuildArtifacts({
      buildArtifacts: false,
      lambdaExists: true,
      skipEnv: undefined,
      webExists: false,
    }), true)
  })

  it("skips the in-program build when LIMETRY_SKIP_ARTIFACT_BUILD is set", () => {
    assert.equal(shouldBuildArtifacts({
      buildArtifacts: true,
      lambdaExists: false,
      skipEnv: "1",
      webExists: false,
    }), false)
  })
})
