/**
 * ACM certificate requests for CloudFront (us-east-1) and API Gateway (stack region).
 *
 * CloudFront requires ACM certificates in US East (N. Virginia). Stack-region
 * certs are for API Gateway custom domains only. DNS validation records are
 * written separately via Cloudflare DNS-only helpers in `cloudflare.ts` — TLS
 * still terminates on ACM / AWS edge, not Cloudflare.
 */

import * as aws from "@pulumi/aws"
import type * as pulumi from "@pulumi/pulumi"

import { getName, getTags } from "./tags.js"

/**
 * Requested certificates and the us-east-1 provider used for CloudFront.
 */
export type CustomDomainCerts = {
  /**
   * Regional ACM certificate for the API custom domain.
   */
  apiCertificate: aws.acm.Certificate
  /**
   * ARN of the API certificate (pre-validation).
   */
  apiCertificateArn: pulumi.Output<string>
  /**
   * Explicit AWS provider pinned to `us-east-1` for CloudFront certs.
   */
  usEast1: aws.Provider
  /**
   * us-east-1 ACM certificate for CloudFront aliases.
   */
  webCertificate: aws.acm.Certificate
  /**
   * ARN of the web certificate (pre-validation).
   */
  webCertificateArn: pulumi.Output<string>
}

/**
 * Hostnames used when requesting DNS-validated ACM certificates.
 */
export type RequestCustomDomainCertsArgs = {
  /**
   * API hostname as the API certificate domain name.
   */
  apiHostname: string
  /**
   * Marketing apex as the CloudFront certificate domain name.
   */
  domain: string
  /**
   * When true, adds `www.${domain}` as a CloudFront SAN.
   */
  includeWww: boolean
}

/**
 * ACM certs for CloudFront (us-east-1) and API Gateway (stack region).
 * DNS validation records are created separately in Cloudflare.
 *
 * @param args - API hostname, marketing domain, and www SAN flag.
 * @returns Certificate resources and the us-east-1 provider.
 */
export function requestCustomDomainCerts(
  args: RequestCustomDomainCertsArgs,
): CustomDomainCerts {
  /**
   * Alias absorbs the mistaken `us-west-2` provider rename so Pulumi does not
   * replace the in-use CloudFront certificate (ResourceInUseException).
   */
  const usEast1 = new aws.Provider(getName("us-east-1"), {
    region: "us-east-1",
  }, {
    aliases: [{ name: getName("us-west-2") }],
  })

  const webSans = args.includeWww ? [`www.${args.domain}`] : undefined
  const webCertificate = new aws.acm.Certificate(
    getName("web-cert"),
    {
      domainName: args.domain,
      subjectAlternativeNames: webSans,
      validationMethod: "DNS",
      tags: getTags("certificates"),
    },
    {
      provider: usEast1,
      deleteBeforeReplace: false,
    },
  )

  const apiCertificate = new aws.acm.Certificate(getName("api-cert"), {
    domainName: args.apiHostname,
    validationMethod: "DNS",
    tags: getTags("certificates"),
  }, {
    deleteBeforeReplace: false,
  })

  return {
    apiCertificate,
    apiCertificateArn: apiCertificate.arn,
    usEast1,
    webCertificate,
    webCertificateArn: webCertificate.arn,
  }
}
