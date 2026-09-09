import * as pulumi from "@pulumi/pulumi"

import { inferCloudflareZoneName } from "./dns-names.js"

/**
 * Typed stack configuration for the Limetry OSS Pulumi project.
 */
export type OssStackConfig = {
  namePrefix: string
  domain: string
  apiHostname: string
  appHostname: string
  manageRoute53: boolean
  createHostedZone: boolean
  hostedZoneId: string | undefined
  /**
   * When true, create Cloudflare CNAMEs to CloudFront / API Gateway and issue ACM certs.
   */
  manageCloudflare: boolean
  cloudflareZoneName: string
  cloudflareZoneId: string | undefined
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
  serverArtifactPath: string
  webDistPath: string
  syncWebAssets: boolean
  /**
   * When true, Pulumi builds the Lambda bundle and web static export before apply.
   */
  buildArtifacts: boolean
  /**
   * When true, `pulumi destroy` empties the CloudFront origin bucket.
   */
  forceDestroyWebBucket: boolean
  githubUrl: string
  discordUrl: string
  contactEmail: string
  legalEmail: string
  privacyEmail: string
  replayWindowMs: string
  throttleMaxRequestsPerMinute: string
  defaultAuditMode: "minimal" | "forensics"
  auditRetentionDays: string
  databaseUrl: pulumi.Output<string>
  jwtSecret: pulumi.Output<string>
  bearerToken: pulumi.Output<string>
  decisionHmacSecret: pulumi.Output<string>
  authSigningPrivateKeyHex: pulumi.Output<string> | undefined
  redisUrl: pulumi.Output<string> | undefined
  neonProjectId: string | undefined
  neonBranchId: string | undefined
}

/**
 * Cloud portal hostname derived from the marketing apex (`www.` stripped).
 */
function defaultAppHostname(domain: string): string {
  const apex = domain.replace(/^www\./, "")
  return `app.${apex}`
}

export function loadOssStackConfig(): OssStackConfig {
  const config = new pulumi.Config()
  const stack = pulumi.getStack()
  const domain = config.get("domain") ?? "limetry.com"
  const defaultAuditMode = config.get("defaultAuditMode") ?? "minimal"
  if (defaultAuditMode !== "minimal" && defaultAuditMode !== "forensics") {
    throw new Error("limetry-oss:defaultAuditMode must be minimal or forensics")
  }

  return {
    namePrefix: `limetry-oss-${stack}`,
    domain,
    apiHostname: config.get("apiHostname") ?? "api.limetry.com",
    appHostname: config.get("appHostname") ?? defaultAppHostname(domain),
    manageRoute53: config.getBoolean("manageRoute53") ?? false,
    createHostedZone: config.getBoolean("createHostedZone") ?? false,
    hostedZoneId: config.get("hostedZoneId"),
    manageCloudflare: config.getBoolean("manageCloudflare") ?? true,
    cloudflareZoneName: config.get("cloudflareZoneName") ?? inferCloudflareZoneName(domain),
    cloudflareZoneId: config.get("cloudflareZoneId"),
    cloudflareProxied: config.getBoolean("cloudflareProxied") ?? true,
    invalidateOnDeploy: config.getBoolean("invalidateOnDeploy") ?? true,
    cloudFrontCertificateArn:
      config.get("cloudFrontCertificateArn") ?? config.get("certificateArn"),
    apiCertificateArn: config.get("apiCertificateArn"),
    serverArtifactPath: config.get("serverArtifactPath") ?? "../server/lambda-bundle",
    webDistPath: config.get("webDistPath") ?? "../web/out",
    syncWebAssets: config.getBoolean("syncWebAssets") ?? true,
    buildArtifacts: config.getBoolean("buildArtifacts") ?? true,
    forceDestroyWebBucket: config.getBoolean("forceDestroyWebBucket") ?? false,
    githubUrl: config.get("githubUrl") ?? "https://github.com/limetry/limetry",
    discordUrl: config.get("discordUrl") ?? "https://discord.gg/limetry",
    contactEmail: config.get("contactEmail") ?? "hello@limetry.com",
    legalEmail: config.get("legalEmail") ?? "legal@limetry.com",
    privacyEmail: config.get("privacyEmail") ?? "privacy@limetry.com",
    replayWindowMs: config.get("replayWindowMs") ?? "300000",
    throttleMaxRequestsPerMinute: config.get("throttleMaxRequestsPerMinute") ?? "5",
    defaultAuditMode,
    auditRetentionDays: config.get("auditRetentionDays") ?? "90",
    databaseUrl: config.requireSecret("databaseUrl"),
    jwtSecret: config.requireSecret("jwtSecret"),
    bearerToken: config.requireSecret("bearerToken"),
    decisionHmacSecret: config.requireSecret("decisionHmacSecret"),
    authSigningPrivateKeyHex: config.getSecret("authSigningPrivateKeyHex"),
    redisUrl: config.getSecret("redisUrl"),
    neonProjectId: config.get("neonProjectId"),
    neonBranchId: config.get("neonBranchId"),
  }
}
