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
import { describeNeonConfig } from "./neon.js"
import { createSecrets } from "./secrets.js"
import { createWeb } from "./web.js"

const cfg = loadOssStackConfig()
const includeWww = shouldManageWww(cfg.domain, cfg.cloudflareZoneName)
const publicHosts = ossPublicUrls({
  apiHostname: cfg.apiHostname,
  appHostname: cfg.appHostname,
  domain: cfg.domain,
  includeWww,
})

ensureInfraArtifacts({
  apiHostname: cfg.apiHostname,
  appHostname: cfg.appHostname,
  buildArtifacts: cfg.buildArtifacts,
  contactEmail: cfg.contactEmail,
  discordUrl: cfg.discordUrl,
  domain: cfg.domain,
  githubUrl: cfg.githubUrl,
  legalEmail: cfg.legalEmail,
  privacyEmail: cfg.privacyEmail,
  serverArtifactPath: cfg.serverArtifactPath,
  webDistPath: cfg.webDistPath,
})

pulumi.log.info(describeNeonConfig({
  projectId: cfg.neonProjectId,
  branchId: cfg.neonBranchId,
}))

const secrets = createSecrets({
  namePrefix: cfg.namePrefix,
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
    namePrefix: cfg.namePrefix,
  })
  cloudflareZoneId = resolveCloudflareZoneId(cfg.cloudflareZoneName, cfg.cloudflareZoneId)
  const issued = createAcmDnsValidation({
    certs,
    namePrefix: cfg.namePrefix,
    zoneId: cloudflareZoneId,
  })
  cloudFrontCertificateArn = cfg.cloudFrontCertificateArn ?? issued.webCertificateArn
  apiCertificateArn = cfg.apiCertificateArn ?? issued.apiCertificateArn
}

const web = createWeb({
  namePrefix: cfg.namePrefix,
  domain: cfg.domain,
  webDistPath: cfg.webDistPath,
  syncWebAssets: cfg.syncWebAssets,
  forceDestroy: cfg.forceDestroyWebBucket,
  certificateArn: cloudFrontCertificateArn,
  includeWww,
  invalidateOnDeploy: cfg.invalidateOnDeploy,
})

const api = createApi({
  namePrefix: cfg.namePrefix,
  apiHostname: cfg.apiHostname,
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
})

if (cfg.manageCloudflare && cloudflareZoneId) {
  createCloudflareTrafficRecords({
    apiHostname: cfg.apiHostname,
    apiTargetDomainName: api.regionalDomainName,
    domain: cfg.domain,
    includeWww,
    namePrefix: cfg.namePrefix,
    proxied: cfg.cloudflareProxied,
    webDistributionDomainName: web.distributionDomainName,
    zoneId: cloudflareZoneId,
  })
}

const dns = createDns({
  namePrefix: cfg.namePrefix,
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

export const websiteUrl = web.websiteUrl
export const websiteWwwUrl = publicHosts.webWww ?? ""
export const websiteEdgeUrl = web.edgeWebsiteUrl
export const appUrl = publicHosts.app
export const apiUrl = publicHosts.api
export const webBucketName = web.bucketName
export const cloudFrontDistributionId = web.distributionId
export const cloudFrontDomainName = web.distributionDomainName

export const apiEndpoint = pulumi.interpolate`${publicHosts.api}/`
export const apiInvokeUrl = api.invokeUrl
export const lambdaArn = api.lambdaArn
export const httpApiId = api.httpApiId

export const ssmParameterPrefix = secrets.parameterPrefix
export const neonNotes = describeNeonConfig({
  projectId: cfg.neonProjectId,
  branchId: cfg.neonBranchId,
})

export const cloudflareWebCnameTarget = dns.cloudflareWebCnameTarget
export const cloudflareApiCnameTarget = dns.cloudflareApiCnameTarget
export const route53HostedZoneId = dns.hostedZoneId ?? pulumi.output("")
export const route53NameServers = dns.nameServers ?? pulumi.output<string[]>([])

export const publicUrls = pulumi
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
      proxied: cfg.cloudflareProxied,
      webTarget,
      zoneName: cfg.cloudflareZoneName,
    }),
  }))

export const dnsHints = publicUrls
