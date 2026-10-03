/**
 * Artifact path resolution and optional pre-apply builds for Lambda + web.
 *
 * When `limetry-oss:buildArtifacts` is true (or artifacts are missing), runs
 * yarn workspace builds for `\@limetry/sdk`, `\@limetry/server`, and
 * `\@limetry/web` with stack-specific `NEXT_PUBLIC_*` values.
 */

import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

import * as pulumi from "@pulumi/pulumi"

/**
 * Inputs controlling which public URLs are baked into the web export.
 */
export type ArtifactBuildInputs = {
  /**
   * API hostname for `NEXT_PUBLIC_API_URL`.
   */
  apiHostname: string
  /**
   * Portal hostname for `NEXT_PUBLIC_APP_URL`.
   */
  portalHostname: string
  /**
   * When true, always rebuild artifacts before apply.
   */
  buildArtifacts: boolean
  /**
   * Contact email for the static export.
   */
  contactEmail: string
  /**
   * Discord invite URL for the static export.
   */
  discordUrl: string
  /**
   * Marketing domain for `NEXT_PUBLIC_WEB_URL`.
   */
  domain: string
  /**
   * GitHub URL for the static export.
   */
  githubUrl: string
  /**
   * Legal contact email for the static export.
   */
  legalEmail: string
  /**
   * Privacy contact email for the static export.
   */
  privacyEmail: string
  /**
   * Relative Lambda artifact path from the Pulumi project root.
   */
  serverArtifactPath: string
  /**
   * Relative web dist path from the Pulumi project root.
   */
  webDistPath: string
  /**
   * Optional Sentry DSN baked as `NEXT_PUBLIC_SENTRY_DSN`.
   */
  sentryDsn?: string
  /**
   * Optional PostHog key baked as `NEXT_PUBLIC_POSTHOG_KEY`.
   */
  posthogPublicProjectToken?: string
  /**
   * PostHog host baked as `NEXT_PUBLIC_POSTHOG_HOST`.
   */
  posthogHost?: string
  /** `"true"` or `"false"` for `NEXT_PUBLIC_IS_SSO_ENABLED`. */
  isSsoEnabled?: string
  /** `"true"` or `"false"` for `NEXT_PUBLIC_IS_GOOGLE_SSO_ENABLED`. */
  isGoogleSsoEnabled?: string
  /** `"true"` or `"false"` for `NEXT_PUBLIC_IS_APPLE_SSO_ENABLED`. */
  isAppleSsoEnabled?: string
  /**
   * `"true"` shows Cloud links. Anything else hides them (`NEXT_PUBLIC_IS_CLOUD_ENABLED`).
   */
  isCloudEnabled?: string
}

/**
 * Absolute directories produced or verified by {@link ensureInfraArtifacts}.
 */
export type ArtifactPaths = {
  /**
   * Absolute Lambda artifact directory.
   */
  serverArtifactDir: string
  /**
   * Absolute web static export directory.
   */
  webDistDir: string
}

/**
 * Injectable yarn runner used by {@link ensureInfraArtifacts} (and tests).
 */
export type YarnRun = (args: readonly string[], env: NodeJS.ProcessEnv) => void

/**
 * Absolute path to packages/infra (Pulumi project root).
 *
 * @returns Absolute filesystem path to this package.
 */
export function resolveInfraRoot(): string {
  return fileURLToPath(new URL("..", import.meta.url))
}

/**
 * Absolute path to the limetry monorepo root.
 *
 * @returns Absolute path two levels above the Pulumi project.
 */
export function resolveRepoRoot(): string {
  return resolve(resolveInfraRoot(), "../..")
}

/**
 * Resolves a path from the Pulumi project root.
 *
 * @param relativePath - Path relative to `packages/infra`.
 * @returns Absolute artifact or dist directory path.
 */
export function resolveArtifactDir(relativePath: string): string {
  return resolve(resolveInfraRoot(), relativePath)
}

/**
 * Normalizes a hostname or URL to an https origin (no trailing slash).
 *
 * @param hostOrUrl - Hostname or full URL.
 * @returns `https://…` origin without a trailing slash.
 */
export function httpsOrigin(hostOrUrl: string): string {
  const trimmed = hostOrUrl.trim().replace(/\/$/, "")
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed
  }
  return `https://${trimmed}`
}

/**
 * NEXT_PUBLIC_* values baked into the static web export for this stack.
 *
 * @param inputs - Hostnames and contact URLs from stack config.
 * @returns Environment map for `yarn workspace \@limetry/web build`.
 */
export function webPublicEnv(inputs: ArtifactBuildInputs): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    LIMETRY_STATIC_EXPORT: "1",
    NODE_ENV: "production",
    NEXT_PUBLIC_WEB_URL: httpsOrigin(inputs.domain),
    NEXT_PUBLIC_API_URL: httpsOrigin(inputs.apiHostname),
    NEXT_PUBLIC_APP_URL: httpsOrigin(inputs.portalHostname),
    NEXT_PUBLIC_GITHUB_URL: httpsOrigin(inputs.githubUrl),
    NEXT_PUBLIC_DISCORD_URL: httpsOrigin(inputs.discordUrl),
    NEXT_PUBLIC_CONTACT_EMAIL: inputs.contactEmail,
    NEXT_PUBLIC_LEGAL_EMAIL: inputs.legalEmail,
    NEXT_PUBLIC_PRIVACY_EMAIL: inputs.privacyEmail,
    NEXT_PUBLIC_IS_SSO_ENABLED: inputs.isSsoEnabled ?? "true",
    NEXT_PUBLIC_IS_GOOGLE_SSO_ENABLED: inputs.isGoogleSsoEnabled ?? "true",
    NEXT_PUBLIC_IS_APPLE_SSO_ENABLED: inputs.isAppleSsoEnabled ?? "true",
    NEXT_PUBLIC_IS_CLOUD_ENABLED: inputs.isCloudEnabled ?? "false",
    EXPO_PUBLIC_IS_SSO_ENABLED: inputs.isSsoEnabled ?? "true",
    EXPO_PUBLIC_IS_GOOGLE_SSO_ENABLED: inputs.isGoogleSsoEnabled ?? "true",
    EXPO_PUBLIC_IS_APPLE_SSO_ENABLED: inputs.isAppleSsoEnabled ?? "true",
  }
  if (inputs.sentryDsn) {
    env.NEXT_PUBLIC_SENTRY_DSN = inputs.sentryDsn
    env.SENTRY_DSN = inputs.sentryDsn
  }
  if (inputs.posthogPublicProjectToken) {
    env.NEXT_PUBLIC_POSTHOG_KEY = inputs.posthogPublicProjectToken
    env.POSTHOG_API_KEY = inputs.posthogPublicProjectToken
  }
  if (inputs.posthogHost) {
    env.NEXT_PUBLIC_POSTHOG_HOST = inputs.posthogHost
    env.POSTHOG_HOST = inputs.posthogHost
  }
  return env
}

/**
 * Decides whether artifact builds should run before Pulumi apply.
 *
 * @param options - Config flag, on-disk presence, and skip env override.
 * @returns True when yarn builds should execute.
 */
export function shouldBuildArtifacts(options: {
  buildArtifacts: boolean
  lambdaExists: boolean
  skipEnv: string | undefined
  webExists: boolean
}): boolean {
  if (options.skipEnv === "1") {
    return false
  }
  return options.buildArtifacts || !options.lambdaExists || !options.webExists
}

/**
 * Creates a yarn runner bound to the monorepo root with inherited stdio.
 *
 * @param repoRootPath - Absolute monorepo root used as `cwd`.
 * @returns Function that runs `yarn` with the given args and env.
 */
export function createYarnRunner(repoRootPath: string): YarnRun {
  return (args, env) => {
    const result = spawnSync("yarn", [...args], {
      cwd: repoRootPath,
      env: { ...process.env, ...env },
      stdio: "inherit",
    })
    if (result.error) {
      throw result.error
    }
    if (result.status !== 0) {
      throw new Error(`yarn ${args.join(" ")} failed with exit ${result.status ?? "unknown"}`)
    }
  }
}

/**
 * Builds the Lambda bundle and Next static export when missing or when
 * `buildArtifacts` is true, so `pulumi up` / `pulumi preview` do not depend
 * on a prior `yarn build:infra:artifacts`.
 *
 * @param inputs - Stack hostnames, paths, and build flag.
 * @param runYarn - Injectable yarn runner (defaults to repo-root spawn).
 * @returns Absolute artifact directories after verification.
 * @throws When the Lambda (or required web) artifact is still missing.
 */
export function ensureInfraArtifacts(
  inputs: ArtifactBuildInputs,
  runYarn: YarnRun = createYarnRunner(resolveRepoRoot()),
): ArtifactPaths {
  const serverArtifactDir = resolveArtifactDir(inputs.serverArtifactPath)
  const webDistDir = resolveArtifactDir(inputs.webDistPath)
  const lambdaExists = existsSync(serverArtifactDir)
  const webExists = existsSync(webDistDir)
  const shouldBuild = shouldBuildArtifacts({
    buildArtifacts: inputs.buildArtifacts,
    lambdaExists,
    skipEnv: process.env.LIMETRY_SKIP_ARTIFACT_BUILD,
    webExists,
  })

  if (shouldBuild) {
    pulumi.log.info("Building OSS Lambda bundle and web static export for Pulumi")
    runYarn(["workspace", "@limetry/sdk", "build"], {})
    runYarn(["workspace", "@limetry/server", "build:lambda"], {})
    runYarn(["workspace", "@limetry/web", "build"], webPublicEnv(inputs))
  }

  if (!existsSync(serverArtifactDir)) {
    throw new Error(
      `Lambda artifact missing at ${serverArtifactDir}. `
      + "Run yarn workspace @limetry/server build:lambda, or set limetry-oss:buildArtifacts true.",
    )
  }

  if (!existsSync(webDistDir) && inputs.buildArtifacts) {
    throw new Error(
      `Web dist missing at ${webDistDir} after the static export. `
      + "Check the Next.js build logs above.",
    )
  }

  return { serverArtifactDir, webDistDir }
}
