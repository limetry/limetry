/**
 * Limetry OSS Pulumi stack entry (`limetry-oss`).
 *
 * Wires artifact builds, SSM secrets, optional Cloudflare DNS-only records
 * (`proxied: false`), ACM certificates, S3 + CloudFront marketing site, Lambda
 * + API Gateway HTTP API, monitoring budgets, and optional Route53 aliases.
 *
 * Stack config lives under the `limetry-oss` Pulumi namespace (see
 * {@link loadOssStackConfig}). TLS terminates on ACM / CloudFront / API Gateway;
 * Cloudflare is grey-cloud only.
 *
 * @packageDocumentation
 */

import * as pulumi from "@pulumi/pulumi"

import { createApi } from "./api.js"
import { ensureInfraArtifacts } from "./artifacts.js"
import { requestCustomDomainCerts } from "./certificates.js"
import {
  assertCloudflareAuth,
  createAcmDnsValidation,
  createCloudflareTrafficRecords,
  resolveCloudflareZoneId,
} from "./cloudflare.js"
import { loadOssStackConfig } from "./config.js"
import { createDns } from "./dns.js"
import {
  cloudflareTrafficHints,
  ossPublicUrls,
  shouldManageWww,
} from "./dns-names.js"
import { createMonitoring } from "./monitoring.js"
import { describeNeonConfig } from "./neon.js"
import { createSecrets } from "./secrets.js"
import { createWeb } from "./web.js"

const cfg = loadOssStackConfig()
const includeWww = shouldManageWww(cfg.domain, cfg.cloudflareZoneName)
const publicHosts = ossPublicUrls({
  apiHostname: cfg.apiHostname,
  portalHostname: cfg.portalHostname,
  domain: cfg.domain,
  includeWww,
})

ensureInfraArtifacts({
  apiHostname: cfg.apiHostname,
  portalHostname: cfg.portalHostname,
  buildArtifacts: cfg.buildArtifacts,
  contactEmail: cfg.contactEmail,
  discordUrl: cfg.discordUrl,
  domain: cfg.domain,
  githubUrl: cfg.githubUrl,
  legalEmail: cfg.legalEmail,
  privacyEmail: cfg.privacyEmail,
  serverArtifactPath: cfg.serverArtifactPath,
  webDistPath: cfg.webDistPath,
  sentryDsn: cfg.sentryDsn,
  posthogPublicProjectToken: cfg.posthogPublicProjectToken,
  posthogHost: cfg.posthogHost,
  isSsoEnabled: cfg.isSsoEnabled,
  isGoogleSsoEnabled: cfg.isGoogleSsoEnabled,
  isAppleSsoEnabled: cfg.isAppleSsoEnabled,
  launchingSoon: cfg.launchingSoon,
})

pulumi.log.info(describeNeonConfig({
  projectId: cfg.neonProjectId,
  branchId: cfg.neonBranchId,
}))

const secrets = createSecrets({
  databaseUrl: cfg.databaseUrl,
  jwtSecret: cfg.jwtSecret,
  bearerToken: cfg.bearerToken,
  decisionHmacSecret: cfg.decisionHmacSecret,
  authSigningPrivateKeyHex: cfg.authSigningPrivateKeyHex,
  redisUrl: cfg.redisUrl,
  neonProjectId: cfg.neonProjectId,
  neonBranchId: cfg.neonBranchId,
})

let cloudFrontCertificateArn: pulumi.Input<string> | undefined = cfg.cloudFrontCertificateArn
let apiCertificateArn: pulumi.Input<string> | undefined = cfg.apiCertificateArn
let cloudflareZoneId: pulumi.Output<string> | undefined

if (cfg.manageCloudflare) {
  assertCloudflareAuth()
  const certs = requestCustomDomainCerts({
    apiHostname: cfg.apiHostname,
    domain: cfg.domain,
    includeWww,
  })
  cloudflareZoneId = resolveCloudflareZoneId(cfg.cloudflareZoneName, cfg.cloudflareZoneId)
  const issued = createAcmDnsValidation({
    certs,
    zoneId: cloudflareZoneId,
  })
  cloudFrontCertificateArn = cfg.cloudFrontCertificateArn ?? issued.webCertificateArn
  apiCertificateArn = cfg.apiCertificateArn ?? issued.apiCertificateArn
}

const web = createWeb({
  domain: cfg.domain,
  webDistPath: cfg.webDistPath,
  syncWebAssets: cfg.syncWebAssets,
  forceDestroy: cfg.forceDestroyWebBucket,
  certificateArn: cloudFrontCertificateArn,
  includeWww,
  invalidateOnDeploy: cfg.invalidateOnDeploy,
})

const api = createApi({
  apiHostname: cfg.apiHostname,
  webHostname: cfg.domain,
  launchingSoon: cfg.launchingSoon,
  serverArtifactPath: cfg.serverArtifactPath,
  databaseUrl: cfg.databaseUrl,
  jwtSecret: cfg.jwtSecret,
  bearerToken: cfg.bearerToken,
  decisionHmacSecret: cfg.decisionHmacSecret,
  replayWindowMs: cfg.replayWindowMs,
  throttleMaxRequestsPerMinute: cfg.throttleMaxRequestsPerMinute,
  defaultAuditMode: cfg.defaultAuditMode,
  auditRetentionDays: cfg.auditRetentionDays,
  authSigningPrivateKeyHex: cfg.authSigningPrivateKeyHex,
  redisUrl: cfg.redisUrl,
  apiCertificateArn,
  sentryDsn: cfg.sentryDsn,
  posthogPublicProjectToken: cfg.posthogPublicProjectToken,
  posthogHost: cfg.posthogHost,
})

const monitoring = createMonitoring({
  lambdaFunctionName: api.lambdaFunctionName,
  logGroupName: api.logGroupName,
  healthMetricNamespace: "Limetry/Health",
  budgetAmount: cfg.budgetAmount,
  budgetThresholds: cfg.budgetThresholds,
  notificationEmail: cfg.notificationEmail,
  enableCostMonitoring: cfg.enableCostMonitoring,
  enableCostAnomalyDetection: cfg.enableCostAnomalyDetection,
})

if (cfg.manageCloudflare && cloudflareZoneId) {
  createCloudflareTrafficRecords({
    apiHostname: cfg.apiHostname,
    apiTargetDomainName: api.regionalDomainName,
    domain: cfg.domain,
    includeWww,
    webDistributionDomainName: web.distributionDomainName,
    zoneId: cloudflareZoneId,
  })
}

const dns = createDns({
  domain: cfg.domain,
  apiHostname: cfg.apiHostname,
  manageRoute53: cfg.manageRoute53,
  createHostedZone: cfg.createHostedZone,
  hostedZoneId: cfg.hostedZoneId,
  webDistributionDomainName: web.distributionDomainName,
  webDistributionHostedZoneId: web.distributionHostedZoneId,
  apiTargetDomainName: api.regionalDomainName,
  apiTargetHostedZoneId: api.regionalHostedZoneId,
  createApiAlias: api.hasCustomDomain,
})

/**
 * Optional `www.` marketing URL when the stack manages apex + www.
 */
export const websiteWwwUrl = publicHosts.webWww ?? ""

/**
 * CloudFront distribution HTTPS origin (edge hostname).
 */
export const websiteEdgeUrl = web.edgeWebsiteUrl

/**
 * Cloud portal hostname URL (`app.` by default).
 */
export const appUrl = publicHosts.app

/**
 * S3 origin bucket name for the marketing static export.
 */
export const webBucketName = web.bucketName

/**
 * CloudFront distribution id for invalidations and console links.
 */
export const cloudFrontDistributionId = web.distributionId

/**
 * CloudFront distribution domain name (CNAME target for DNS-only Cloudflare).
 */
export const cloudFrontDomainName = web.distributionDomainName

/**
 * Public API HTTPS origin with trailing slash (custom hostname when configured).
 */
export const apiEndpoint = pulumi.interpolate`${publicHosts.api}/`

/**
 * API Gateway `$default` stage invoke URL (execute-api hostname).
 */
export const apiInvokeUrl = api.invokeUrl

/**
 * API Lambda function ARN.
 */
export const lambdaArn = api.lambdaArn

/**
 * API Gateway HTTP API id.
 */
export const httpApiId = api.httpApiId

/**
 * CloudWatch alarm ARN for API DEGRADED health log events.
 */
export const stabilityAlarmArn = monitoring.stabilityAlarmArn

/**
 * AWS Budgets id for this stack's Project/Stack-tagged cost budget.
 */
export const stackBudgetId = monitoring.budgetId

/**
 * SSM Parameter Store prefix (`/limetry/${project}/${stack}`).
 */
export const ssmParameterPrefix = secrets.parameterPrefix

/**
 * Human-readable Neon wiring notes logged and exported for operators.
 */
export const neonNotes = describeNeonConfig({
  projectId: cfg.neonProjectId,
  branchId: cfg.neonBranchId,
})

/**
 * CloudFront domain operators CNAME the apex (DNS-only) to.
 */
export const cloudflareWebCnameTarget = dns.cloudflareWebCnameTarget

/**
 * API Gateway regional domain operators CNAME the API host (DNS-only) to.
 */
export const cloudflareApiCnameTarget = dns.cloudflareApiCnameTarget

/**
 * Route53 hosted zone id when `manageRoute53` is enabled; otherwise empty.
 */
export const route53HostedZoneId = dns.hostedZoneId ?? pulumi.output("")

/**
 * Route53 name servers when Pulumi creates the hosted zone; otherwise empty.
 */
export const route53NameServers = dns.nameServers ?? pulumi.output<string[]>([])

const publicUrls = pulumi
  .all([web.edgeWebsiteUrl, api.invokeUrl, dns.cloudflareWebCnameTarget, dns.cloudflareApiCnameTarget])
  .apply(([webEdge, apiEdge, webTarget, apiTarget]) => ({
    web: publicHosts.web,
    webWww: publicHosts.webWww,
    webEdge,
    api: publicHosts.api,
    apiEdge,
    app: publicHosts.app,
    apex: cfg.domain,
    apiHost: cfg.apiHostname,
    cloudflare: cloudflareTrafficHints({
      apiHostname: cfg.apiHostname,
      apiTarget: apiTarget,
      domain: cfg.domain,
      includeWww,
      proxied: false,
      webTarget,
      zoneName: cfg.cloudflareZoneName,
    }),
  }))

/**
 * Public API HTTPS origin (printed last so `pulumi up` ends with primary URLs).
 */
export const apiUrl = publicUrls.api

/**
 * Public marketing HTTPS origin (printed last so `pulumi up` ends with primary URLs).
 */
export const websiteUrl = publicUrls.web
