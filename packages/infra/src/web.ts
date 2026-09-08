/**
 * S3 + CloudFront factory for the `\@limetry/web` static export.
 *
 * Private S3 origin with Origin Access Control, SPA-style 403/404 →
 * `index.html` fallbacks, long-lived caching for `/_next/static/*`, and an
 * optional sync + CloudFront invalidation when the content hash changes.
 */

import { existsSync } from "node:fs"
import { resolve } from "node:path"

import * as aws from "@pulumi/aws"
import { local } from "@pulumi/command"
import * as pulumi from "@pulumi/pulumi"

import { resolveArtifactDir, resolveInfraRoot } from "./artifacts.js"
import { hashDirectory } from "./content-hash.js"
import { getName, getTags } from "./tags.js"

/**
 * Inputs for {@link createWeb}.
 */
export type WebInputs = {
  /**
   * Marketing domain used for CloudFront aliases and the public website URL.
   */
  domain: string
  /**
   * Relative path to the Next static export directory.
   */
  webDistPath: string
  /**
   * When true, sync local dist into the origin bucket on apply.
   */
  syncWebAssets: boolean
  /**
   * When true, `pulumi destroy` empties and deletes the marketing-site bucket.
   */
  forceDestroy: boolean
  /**
   * us-east-1 ACM certificate ARN for custom aliases; omit for `*.cloudfront.net`.
   */
  certificateArn: pulumi.Input<string> | undefined
  /**
   * When true with a certificate, include `www.${domain}` as an alias.
   */
  includeWww: boolean
  /**
   * When true, create a CloudFront invalidation whenever the static export hash changes.
   */
  invalidateOnDeploy: boolean
}

/**
 * Outputs from {@link createWeb}.
 */
export type WebOutputs = {
  /**
   * Origin bucket name.
   */
  bucketName: pulumi.Output<string>
  /**
   * Bucket regional domain name (CloudFront origin).
   */
  bucketRegionalDomainName: pulumi.Output<string>
  /**
   * CloudFront distribution id.
   */
  distributionId: pulumi.Output<string>
  /**
   * CloudFront domain name (DNS-only Cloudflare CNAME target).
   */
  distributionDomainName: pulumi.Output<string>
  /**
   * CloudFront hosted zone id for Route53 aliases.
   */
  distributionHostedZoneId: pulumi.Output<string>
  /**
   * HTTPS URL for the CloudFront edge hostname.
   */
  edgeWebsiteUrl: pulumi.Output<string>
  /**
   * HTTPS URL for the configured marketing domain.
   */
  websiteUrl: pulumi.Output<string>
}

/**
 * S3 + CloudFront for packages/web static export (LIMETRY_STATIC_EXPORT=1).
 *
 * @param inputs - Dist path, sync flags, certificate, and alias options.
 * @returns Bucket and CloudFront distribution outputs.
 */
export function createWeb(inputs: WebInputs): WebOutputs {
  const distDir = resolveArtifactDir(inputs.webDistPath)

  const bucket = new aws.s3.Bucket(getName("web"), {
    bucketPrefix: `${getName("web")}-`,
    forceDestroy: inputs.forceDestroy,
    tags: getTags("web"),
  })

  new aws.s3.BucketPublicAccessBlock(getName("web-pab"), {
    bucket: bucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  })

  new aws.s3.BucketServerSideEncryptionConfiguration(
    getName("web-sse"),
    {
      bucket: bucket.id,
      rules: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "AES256",
          },
        },
      ],
    },
  )

  const oac = new aws.cloudfront.OriginAccessControl(getName("web-oac"), {
    name: getName("web-oac"),
    originAccessControlOriginType: "s3",
    signingBehavior: "always",
    signingProtocol: "sigv4",
  })

  const aliases = inputs.certificateArn
    ? (inputs.includeWww ? [inputs.domain, `www.${inputs.domain}`] : [inputs.domain])
    : undefined

  const distribution = new aws.cloudfront.Distribution(
    getName("web-cdn"),
    {
      enabled: true,
      isIpv6Enabled: true,
      comment: `Limetry OSS web (${inputs.domain})`,
      defaultRootObject: "index.html",
      aliases,
      origins: [
        {
          originId: "s3-web",
          domainName: bucket.bucketRegionalDomainName,
          originAccessControlId: oac.id,
        },
      ],
      orderedCacheBehaviors: [
        {
          pathPattern: "/_next/static/*",
          targetOriginId: "s3-web",
          viewerProtocolPolicy: "redirect-to-https",
          allowedMethods: ["GET", "HEAD", "OPTIONS"],
          cachedMethods: ["GET", "HEAD", "OPTIONS"],
          compress: true,
          forwardedValues: {
            queryString: false,
            cookies: { forward: "none" },
          },
          minTtl: 0,
          defaultTtl: 31536000,
          maxTtl: 31536000,
        },
      ],
      defaultCacheBehavior: {
        targetOriginId: "s3-web",
        viewerProtocolPolicy: "redirect-to-https",
        allowedMethods: ["GET", "HEAD", "OPTIONS"],
        cachedMethods: ["GET", "HEAD", "OPTIONS"],
        compress: true,
        forwardedValues: {
          queryString: false,
          cookies: { forward: "none" },
        },
        minTtl: 0,
        defaultTtl: 60,
        maxTtl: 31536000,
      },
      // SPA fallback for unknown HTML routes. Do not delete prior `/_next/static`
      // objects on sync — a 404 here would be rewritten to index.html and poison
      // cached script URLs in Safari (blank page in regular tabs, Private OK).
      customErrorResponses: [
        {
          errorCode: 403,
          responseCode: 200,
          responsePagePath: "/index.html",
          errorCachingMinTtl: 0,
        },
        {
          errorCode: 404,
          responseCode: 200,
          responsePagePath: "/index.html",
          errorCachingMinTtl: 0,
        },
      ],
      restrictions: {
        geoRestriction: {
          restrictionType: "none",
        },
      },
      viewerCertificate: inputs.certificateArn
        ? {
          acmCertificateArn: inputs.certificateArn,
          sslSupportMethod: "sni-only",
          minimumProtocolVersion: "TLSv1.2_2021",
        }
        : {
          cloudfrontDefaultCertificate: true,
        },
      tags: getTags("web"),
    },
  )

  const bucketPolicy = aws.iam.getPolicyDocumentOutput({
    statements: [
      {
        sid: "AllowCloudFrontServicePrincipal",
        actions: ["s3:GetObject"],
        resources: [pulumi.interpolate`${bucket.arn}/*`],
        principals: [
          {
            type: "Service",
            identifiers: ["cloudfront.amazonaws.com"],
          },
        ],
        conditions: [
          {
            test: "StringEquals",
            variable: "AWS:SourceArn",
            values: [distribution.arn],
          },
        ],
      },
    ],
  })

  const policy = new aws.s3.BucketPolicy(getName("web-policy"), {
    bucket: bucket.id,
    policy: bucketPolicy.json,
  })

  if (inputs.syncWebAssets) {
    if (!existsSync(distDir)) {
      pulumi.log.warn(
        `Web dist missing at ${distDir}. Pulumi builds it when limetry-oss:buildArtifacts is true.`,
      )
    } else {
      const contentHash = hashDirectory(distDir)
      const syncScript = resolve(resolveInfraRoot(), "scripts/sync-static-site.mjs")
      const awsConfig = new pulumi.Config("aws")
      const region = awsConfig.require("region")
      const syncCommand = inputs.invalidateOnDeploy
        ? pulumi.interpolate`node ${JSON.stringify(syncScript)} ${bucket.bucket} ${JSON.stringify(distDir)} ${distribution.id} ${region}`
        : pulumi.interpolate`node ${JSON.stringify(syncScript)} ${bucket.bucket} ${JSON.stringify(distDir)} "" ${region}`
      new local.Command(
        getName("web-sync"),
        {
          create: syncCommand,
          update: syncCommand,
          triggers: [contentHash],
          environment: {
            AWS_REGION: region,
            AWS_DEFAULT_REGION: region,
          },
        },
        { dependsOn: [distribution, policy] },
      )
    }
  }

  return {
    bucketName: bucket.bucket,
    bucketRegionalDomainName: bucket.bucketRegionalDomainName,
    distributionId: distribution.id,
    distributionDomainName: distribution.domainName,
    distributionHostedZoneId: distribution.hostedZoneId,
    edgeWebsiteUrl: pulumi.interpolate`https://${distribution.domainName}`,
    websiteUrl: pulumi.interpolate`https://${inputs.domain}`,
  }
}
