/**
 * Typed Pulumi config loader for the Limetry OSS stack (`limetry-oss:*` keys).
 *
 * Secrets (`databaseUrl`, `jwtSecret`, `bearerToken`, `decisionHmacSecret`, and
 * optional signing / Redis URLs) are required or optional via
 * `pulumi.Config.requireSecret` / `getSecret`. Cloudflare records created by
 * this stack are always DNS-only; `cloudflareProxied` is forced to `false`.
 */

import * as pulumi from "@pulumi/pulumi"

import { type BudgetThresholds, resolveBudgetThresholds } from "./budget-config.js"
import { inferCloudflareZoneName } from "./dns-names.js"

/**
 * Typed stack configuration for the Limetry OSS Pulumi project.
 *
 * Config keys (namespace `limetry-oss` unless noted):
 * - `domain` — marketing apex hostname (default `limetry.com`).
 * - `apiHostname` — API custom domain (default `api.limetry.com`).
 * - `portalHostname` — cloud portal host (default `app.` + apex).
 * - `manageRoute53` / `createHostedZone` / `hostedZoneId` — optional AWS DNS.
 * - `manageCloudflare` — create DNS-only Cloudflare CNAMEs + ACM validation.
 * - `cloudflareZoneName` / `cloudflareZoneId` — zone lookup or explicit id.
 * - `cloudflareProxied` — deprecated; always `false` (grey cloud).
 * - `invalidateOnDeploy` — CloudFront `/*` invalidation on content hash change.
 * - `cloudFrontCertificateArn` / `certificateArn` — us-east-1 ACM for CloudFront.
 * - `apiCertificateArn` — regional ACM for API Gateway custom domain.
 * - `serverArtifactPath` / `webDistPath` — Lambda bundle and Next static export.
 * - `syncWebAssets` / `buildArtifacts` / `forceDestroyWebBucket` — deploy behavior.
 * - `budgetAmount` / `budget*Percent` / `notificationEmail` — AWS Budgets.
 * - `enableCostMonitoring` / `enableCostAnomalyDetection` — Cost Explorer.
 * - `githubUrl` / `discordUrl` — baked into web `NEXT_PUBLIC_*`.
 * - `replayWindowMs` / `throttleMaxRequestsPerMinute` / audit modes — API env.
 * - Secrets: `databaseUrl`, `jwtSecret`, `bearerToken`, `decisionHmacSecret`,
 *   optional `authSigningPrivateKeyHex`, `redisUrl`, `neonProjectId`, `neonBranchId`.
 */
export type OssStackConfig = {
  /**
   * When true, provision only the API resources needed by an isolated load test.
   */
  isLoadTestApiOnly: boolean
  /**
   * When true, the isolated API uses in-memory stores instead of Postgres.
   */
  isLoadTestStoreMemory: boolean
  /**
   * Marketing apex hostname (CloudFront alias when certificates are managed).
   */
  domain: string
  /**
   * API custom domain hostname (API Gateway domain name when cert present).
   */
  apiHostname: string
  /**
   * Cloud portal hostname exported as `NEXT_PUBLIC_APP_URL`.
   */
  portalHostname: string
  /**
   * When true, create optional Route53 aliases alongside Cloudflare.
   */
  manageRoute53: boolean
  /**
   * When true with `manageRoute53`, create a new hosted zone for `domain`.
   */
  createHostedZone: boolean
  /**
   * Existing Route53 hosted zone id when not creating one.
   */
  hostedZoneId: string | undefined
  /**
   * When true, create Cloudflare CNAMEs to CloudFront / API Gateway and issue ACM certs.
   * Records are always DNS-only (`proxied: false`); TLS terminates on AWS.
   */
  manageCloudflare: boolean
  /**
   * Cloudflare zone name used for lookups (inferred from `domain` when unset).
   */
  cloudflareZoneName: string
  /**
   * Explicit Cloudflare zone id; skips name lookup when set.
   */
  cloudflareZoneId: string | undefined
  /**
   * Deprecated. Cloudflare DNS records are always DNS-only (`proxied: false`).
   */
  cloudflareProxied: boolean
  /**
   * When true, invalidate CloudFront `/*` when the static export hash changes.
   */
  invalidateOnDeploy: boolean
  /**
   * ACM certificate in us-east-1 for CloudFront custom domains.
   */
  cloudFrontCertificateArn: string | undefined
  /**
   * ACM certificate in the stack region for API Gateway custom domain.
   */
  apiCertificateArn: string | undefined
  /**
   * Relative path from the Pulumi project root to the Lambda zip directory.
   */
  serverArtifactPath: string
  /**
   * Relative path from the Pulumi project root to the Next static export.
   */
  webDistPath: string
  /**
   * When true, sync the static export into the S3 origin on apply.
   */
  syncWebAssets: boolean
  /**
   * When true, Pulumi builds the Lambda bundle and web static export before apply.
   */
  buildArtifacts: boolean
  /**
   * When true, `pulumi destroy` empties the CloudFront origin bucket.
   */
  forceDestroyWebBucket: boolean
  /**
   * Monthly USD budget limit for this stack's Project-tagged resources.
   */
  budgetAmount: string
  /**
   * AWS Budgets ACTUAL/FORECASTED notification percentages.
   */
  budgetThresholds: BudgetThresholds
  /**
   * Email for budget (and optional anomaly) notifications.
   */
  notificationEmail: string
  /**
   * When true with enableCostAnomalyDetection, create a CUSTOM Project-tag Cost Explorer anomaly monitor.
   */
  enableCostMonitoring: boolean
  /**
   * When true with enableCostMonitoring, subscribe to Cost Anomaly Detection.
   */
  enableCostAnomalyDetection: boolean
  /**
   * Public GitHub URL baked into the static web export.
   */
  githubUrl: string
  /**
   * Public Discord invite URL baked into the static web export.
   */
  discordUrl: string
  /**
   * API replay window in milliseconds (`REPLAY_WINDOW_MS`).
   */
  replayWindowMs: string
  /**
   * API throttle ceiling (`THROTTLE_MAX_REQUESTS_PER_MINUTE`).
   */
  throttleMaxRequestsPerMinute: string
  /**
   * Default audit retention mode for the API (`minimal` or `forensics`).
   */
  defaultAuditMode: "minimal" | "forensics"
  /**
   * Audit retention days (`LIMETRY_AUDIT_RETENTION_DAYS`).
   */
  auditRetentionDays: string
  /**
   * Neon (or other) Postgres connection string secret.
   */
  databaseUrl: pulumi.Output<string> | undefined
  /**
   * JWT signing secret for the API.
   */
  jwtSecret: pulumi.Output<string>
  /**
   * Bearer token accepted by the API.
   */
  bearerToken: pulumi.Output<string>
  /**
   * HMAC secret for decision receipts.
   */
  decisionHmacSecret: pulumi.Output<string>
  /**
   * Optional auth signing private key (hex) for the API.
   */
  authSigningPrivateKeyHex: pulumi.Output<string> | undefined
  /**
   * Optional Redis / Upstash URL for the API.
   */
  redisUrl: pulumi.Output<string> | undefined
  /**
   * Optional Neon project id recorded as SSM metadata.
   */
  neonProjectId: string | undefined
  /**
   * Optional Neon branch id recorded as SSM metadata.
   */
  neonBranchId: string | undefined
  /**
   * Optional Sentry DSN for Lambda (`SENTRY_DSN`) and static `NEXT_PUBLIC_SENTRY_DSN`.
   * Client-visible; store as plain config or secret.
   */
  sentryDsn: string | undefined
  /**
   * Optional PostHog project API key for Lambda and static `NEXT_PUBLIC_POSTHOG_KEY`.
   * Client-visible, so it stays a plaintext string for the static export even when
   * Pulumi stores the config value as a secret.
   */
  posthogPublicProjectToken: string | undefined
  /**
   * PostHog host origin (default US cloud).
   */
  posthogHost: string
  /**
   * Master switch for Google and Apple sign-in (`"true"` or `"false"`).
   */
  isSsoEnabled: string
  /**
   * Google sign-in switch. Ignored when `isSsoEnabled` is false.
   */
  isGoogleSsoEnabled: string
  /**
   * Apple sign-in switch. Ignored when `isSsoEnabled` is false.
   */
  isAppleSsoEnabled: string
  /**
   * `"true"` publishes Cloud links on the OSS site. Defaults to hidden.
   */
  isCloudEnabled: string
  /**
   * `"true"` enables public Cloud and auth links after launch.
   */
  launchingSoon: string
}

/**
 * Cloud portal hostname derived from the marketing apex (`www.` stripped).
 *
 * @param domain - Marketing domain that may include a `www.` prefix.
 * @returns `app.` hostname for the apex.
 */
function defaultAppHostname(domain: string): string {
  const apex = domain.replace(/^www\./, "")
  return `app.${apex}`
}

/**
 * Loads and validates `limetry-oss` Pulumi config into {@link OssStackConfig}.
 *
 * Forces `cloudflareProxied` to `false` so config cannot re-enable orange-cloud
 * proxying toward CloudFront or API Gateway.
 *
 * @returns Fully resolved stack configuration including secret Outputs.
 * @throws When `defaultAuditMode` is not `minimal` or `forensics`.
 */
export function loadOssStackConfig(): OssStackConfig {
  const config = new pulumi.Config()
  const domain = config.get("domain") ?? "limetry.com"
  const defaultAuditMode = config.get("defaultAuditMode") ?? "minimal"
  if (defaultAuditMode !== "minimal" && defaultAuditMode !== "forensics") {
    throw new Error("limetry-oss:defaultAuditMode must be minimal or forensics")
  }

  const isLoadTestStoreMemory = config.getBoolean("isLoadTestStoreMemory") ?? false
  const databaseUrl = isLoadTestStoreMemory ? undefined : config.getSecret("databaseUrl")
  if (!isLoadTestStoreMemory && !databaseUrl) {
    throw new Error("limetry-oss:databaseUrl is required when isLoadTestStoreMemory is false")
  }

  return {
    isLoadTestApiOnly: config.getBoolean("isLoadTestApiOnly") ?? false,
    isLoadTestStoreMemory,
    domain,
    apiHostname: config.get("apiHostname") ?? "api.limetry.com",
    portalHostname: config.get("portalHostname") ?? defaultAppHostname(domain),
    manageRoute53: config.getBoolean("manageRoute53") ?? false,
    createHostedZone: config.getBoolean("createHostedZone") ?? false,
    hostedZoneId: config.get("hostedZoneId"),
    manageCloudflare: config.getBoolean("manageCloudflare") ?? true,
    cloudflareZoneName: config.get("cloudflareZoneName") ?? inferCloudflareZoneName(domain),
    cloudflareZoneId: config.get("cloudflareZoneId"),
    cloudflareProxied: false,
    invalidateOnDeploy: config.getBoolean("invalidateOnDeploy") ?? true,
    cloudFrontCertificateArn:
      config.get("cloudFrontCertificateArn") ?? config.get("certificateArn"),
    apiCertificateArn: config.get("apiCertificateArn"),
    serverArtifactPath: config.get("serverArtifactPath") ?? "../server/lambda-bundle",
    webDistPath: config.get("webDistPath") ?? "../web/out",
    syncWebAssets: config.getBoolean("syncWebAssets") ?? true,
    buildArtifacts: config.getBoolean("buildArtifacts") ?? true,
    forceDestroyWebBucket: config.getBoolean("forceDestroyWebBucket") ?? true,
    budgetAmount: config.get("budgetAmount") ?? "5",
    budgetThresholds: resolveBudgetThresholds((key) => config.get(key)),
    notificationEmail: config.require("notificationEmail"),
    enableCostMonitoring: config.getBoolean("enableCostMonitoring") ?? false,
    enableCostAnomalyDetection: config.getBoolean("enableCostAnomalyDetection") ?? false,
    githubUrl: config.get("githubUrl") ?? "https://github.com/limetry/limetry",
    discordUrl: config.get("discordUrl") ?? "https://discord.gg/VxUWz7cZP",
    replayWindowMs: config.get("replayWindowMs") ?? "300000",
    throttleMaxRequestsPerMinute: config.get("throttleMaxRequestsPerMinute") ?? "5",
    defaultAuditMode,
    auditRetentionDays: config.get("auditRetentionDays") ?? "90",
    databaseUrl,
    jwtSecret: config.requireSecret("jwtSecret"),
    bearerToken: config.requireSecret("bearerToken"),
    decisionHmacSecret: config.requireSecret("decisionHmacSecret"),
    authSigningPrivateKeyHex: config.getSecret("authSigningPrivateKeyHex"),
    redisUrl: config.getSecret("redisUrl"),
    neonProjectId: config.get("neonProjectId"),
    neonBranchId: config.get("neonBranchId"),
    sentryDsn: config.get("sentryDsn") ?? process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
    posthogPublicProjectToken: config.get("posthogPublicProjectToken")
      ?? process.env.POSTHOG_API_KEY
      ?? process.env.POSTHOG_KEY
      ?? process.env.NEXT_PUBLIC_POSTHOG_KEY,
    isSsoEnabled: String(config.getBoolean("isSsoEnabled") ?? true),
    isGoogleSsoEnabled: String(config.getBoolean("isGoogleSsoEnabled") ?? true),
    isAppleSsoEnabled: String(config.getBoolean("isAppleSsoEnabled") ?? true),
    isCloudEnabled: String(config.getBoolean("isCloudEnabled") ?? false),
    launchingSoon: String(config.getBoolean("launchingSoon") ?? false),
    posthogHost: config.get("posthogHost")
      ?? process.env.POSTHOG_HOST
      ?? process.env.NEXT_PUBLIC_POSTHOG_HOST
      ?? "https://us.i.posthog.com",
  }
}
