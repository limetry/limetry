import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import {
  APP_VERSION,
  AppFooterVersion,
  AppVersion,
  formatAppFooterVersionLabel,
  formatAppVersionLabel,
  resolveAppVersion,
} from "./app-version"

describe("AppVersion", () => {
  it("matches package / build-info and formats release labels", () => {
    const packagePath = join(dirname(fileURLToPath(import.meta.url)), "../package.json")
    const rootPackagePath = join(dirname(fileURLToPath(import.meta.url)), "../../../package.json")
    const buildInfoPath = join(dirname(fileURLToPath(import.meta.url)), "../../../build-info.json")
    const packageJson = JSON.parse(readFileSync(packagePath, "utf8")) as { version: string }
    const rootPackageJson = JSON.parse(readFileSync(rootPackagePath, "utf8")) as { version: string }
    const buildInfo = JSON.parse(readFileSync(buildInfoPath, "utf8")) as {
      version: string
      build: number
    }

    expect(packageJson.version).toBe(rootPackageJson.version)
    expect(APP_VERSION).toBe(packageJson.version)
    expect(buildInfo.version).toBe(packageJson.version)

    const release = resolveAppVersion({ NODE_ENV: "production" })
    expect(release.channel).toBe("release")
    expect(release.version).toBe(buildInfo.version)
    expect(release.build).toBe(buildInfo.build)
    expect(release.label).toBe(`v${buildInfo.version}`)
    expect(release.footerLabel).toBe(`v${buildInfo.version}-${buildInfo.build}`)
    expect(AppVersion({ NODE_ENV: "production" })).toBe(release.label)
    expect(AppFooterVersion({ NODE_ENV: "production" })).toBe(release.footerLabel)
  })

  it("formats local labels with seeded commit counts", () => {
    expect(
      formatAppVersionLabel({
        version: "1.2.94",
        build: 7,
        channel: "dev",
        devCommits: 3,
      }),
    ).toBe("v1.2.94-dev-3")
    expect(
      formatAppFooterVersionLabel({
        version: "1.2.94",
        build: 7,
        channel: "release",
        devCommits: 0,
      }),
    ).toBe("v1.2.94-7")
    expect(
      formatAppVersionLabel({
        version: "1.2.94",
        build: 7,
        channel: "release",
        devCommits: 0,
      }),
    ).toBe("v1.2.94")

    const local = resolveAppVersion({
      NODE_ENV: "development",
      LIMETRY_DEV_COMMITS: "5",
    })
    expect(local.channel).toBe("dev")
    expect(local.label).toBe(`v${local.version}-dev-5`)
    expect(local.footerLabel).toBe(local.label)
  })

  it("prefers baked NEXT_PUBLIC_LIMETRY_APP_VERSION over channel detection", () => {
    const legacy = resolveAppVersion({
      NODE_ENV: "development",
      NEXT_PUBLIC_LIMETRY_APP_VERSION: "v1.2.98-7",
    })
    expect(legacy.channel).toBe("release")
    expect(legacy.label).toBe("v1.2.98")
    expect(legacy.footerLabel).toBe("v1.2.98-7")
    expect(legacy.version).toBe("1.2.98")
    expect(legacy.build).toBe(7)

    const bare = resolveAppVersion({
      NODE_ENV: "development",
      NEXT_PUBLIC_LIMETRY_APP_VERSION: "v1.2.98",
    })
    expect(bare.channel).toBe("release")
    expect(bare.label).toBe("v1.2.98")
    expect(bare.footerLabel).toBe(`v1.2.98-${bare.build}`)
    expect(bare.version).toBe("1.2.98")
  })

  it("treats unset NODE_ENV as release (published npm CLIs)", () => {
    const published = resolveAppVersion({})
    expect(published.channel).toBe("release")
    expect(published.label).toBe(`v${published.version}`)
    expect(published.footerLabel).toBe(`v${published.version}-${published.build}`)
    expect(published.label).not.toContain("-dev-")
  })
})
