/**
 * Next.js config for `\@limetry/web`: MDX via fumadocs, optional static export,
 * monorepo dotenv loading, and sync preflight before production builds.
 */
import { spawnSync } from "node:child_process"
import { EventEmitter } from "node:events"
import path from "node:path"
import { fileURLToPath } from "node:url"

import dotenvx from "@dotenvx/dotenvx"
import { withSentryConfig } from "@sentry/nextjs/config"
import { createMDX } from "fumadocs-mdx/next"
import type { NextConfig } from "next"

EventEmitter.defaultMaxListeners = 30

const dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(dirname, "../..")

if (!process.env.VERCEL) {
  dotenvx.config({ path: repoRoot, convention: "nextjs", quiet: true })
}

/**
 * Runs package preflight in a child process unless skip/export/test flags apply.
 *
 * Inherits monorepo `.env` (including `NEXT_PUBLIC_SENTRY_DSN` / PostHog) so
 * telemetry probes run the same way as the portal and OSS API.
 */
function runWebPreflightSync(): void {
  if (
    process.env.LIMETRY_SKIP_PREFLIGHT === "1"
    || process.env.LIMETRY_STATIC_EXPORT === "1"
    || process.env.NODE_ENV === "test"
  ) {
    return
  }
  const building = process.env.NEXT_PHASE === "phase-production-build"
    || process.env.NEXT_PHASE === "phase-export"
    || process.argv.includes("build")
  const script = path.join(dirname, "scripts/run-preflight.mjs")
  const result = spawnSync(process.execPath, [script], {
    cwd: dirname,
    env: {
      ...process.env,
      ...(building && !process.env.NEXT_PHASE
        ? { NEXT_PHASE: "phase-production-build" }
        : {}),
    },
    stdio: "inherit",
  })
  if ((result.status ?? 1) !== 0 && process.env.NODE_ENV === "production" && !building) {
    throw new Error("Web preflight failed")
  }
}

runWebPreflightSync()

const withMDX = createMDX()

const staticExport = process.env.LIMETRY_STATIC_EXPORT === "1"

/**
 * Base Next config: MDX, optional static export, docs/pricing redirects.
 */
const config: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pino", "@limetry/preflight"],
  // Transpile only the drawer subpath graph from @limetry/ui (DOM implementation).
  // Do not pull the RN-first main barrel into this package.
  transpilePackages: ["@limetry/ui"],
  ...(staticExport
    ? {
      output: "export" as const,
      images: { unoptimized: true },
    }
    : {
      async redirects() {
        return [
          {
            source: "/docs",
            destination: "/docs/introduction",
            permanent: false,
          },
          {
            source: "/pricing",
            destination: process.env.NEXT_PUBLIC_APP_URL || "https://app.limetry.com",
            permanent: true,
          },
        ]
      },
    }),
}

export default withSentryConfig(withMDX(config), {
  org: "disrupt-dev",

  project: "limetry-open-web",

  silent: !process.env.CI,

  widenClientFileUpload: true,

  /**
   * `tunnelRoute` needs a Next server rewrite. Static exports have no server,
   * so omit the tunnel when `LIMETRY_STATIC_EXPORT=1`.
   */
  ...(staticExport ? {} : { tunnelRoute: "/monitoring" }),

  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
})
