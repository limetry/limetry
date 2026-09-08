/**
 * Optional Route53 aliases and always-on Cloudflare CNAME target exports.
 *
 * When Cloudflare manages public DNS, operators still need the CloudFront and
 * API Gateway hostnames; this module always exports those targets even when
 * `manageRoute53` is false.
 */

import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi"

import { getName, getTags } from "./tags.js"

/**
 * Inputs for optional Route53 management and CNAME target exports.
 */
export type DnsInputs = {
  /**
   * Marketing apex domain for A/alias records.
   */
  domain: string
  /**
   * API hostname for A/alias or CNAME records.
   */
  apiHostname: string
  /**
   * When false, skip Route53 resources and only export Cloudflare targets.
   */
  manageRoute53: boolean
  /**
   * When true, create a new hosted zone for `domain`.
   */
  createHostedZone: boolean
  /**
   * Existing hosted zone id when not creating one.
   */
  hostedZoneId: string | undefined
  /**
   * CloudFront distribution domain name.
   */
  webDistributionDomainName: pulumi.Input<string>
  /**
   * CloudFront hosted zone id for alias records.
   */
  webDistributionHostedZoneId: pulumi.Input<string>
  /**
   * API Gateway regional domain name (or execute-api host).
   */
  apiTargetDomainName: pulumi.Input<string>
  /**
   * API Gateway hosted zone id when using alias A records.
   */
  apiTargetHostedZoneId: pulumi.Input<string> | undefined
  /**
   * When true, prefer Route53 alias A to the custom API domain.
   */
  createApiAlias: boolean
}

/**
 * Route53 outputs plus Cloudflare CNAME targets for operators.
 */
export type DnsOutputs = {
  /**
   * Hosted zone id when Route53 is managed.
   */
  hostedZoneId: pulumi.Output<string> | undefined
  /**
   * Name servers when Pulumi creates the zone.
   */
  nameServers: pulumi.Output<string[]> | undefined
  /**
   * CloudFront domain for DNS-only Cloudflare web CNAMEs.
   */
  cloudflareWebCnameTarget: pulumi.Output<string>
  /**
   * API Gateway domain for DNS-only Cloudflare API CNAMEs.
   */
  cloudflareApiCnameTarget: pulumi.Output<string>
  /**
   * Optional Route53 web record FQDN.
   */
  route53WebRecordFqdn: pulumi.Output<string> | undefined
  /**
   * Optional Route53 API record FQDN.
   */
  route53ApiRecordFqdn: pulumi.Output<string> | undefined
}

/**
 * Optional Route53 aliases for limetry.com + api.limetry.com.
 * Always exports Cloudflare CNAME targets so DNS can live outside AWS.
 *
 * @param inputs - Domain, API host, Route53 flags, and AWS edge targets.
 * @returns Zone outputs (when managed) and Cloudflare CNAME targets.
 * @throws When `manageRoute53` is true without a zone id or create flag.
 */
export function createDns(inputs: DnsInputs): DnsOutputs {
  const cloudflareWebCnameTarget = pulumi.output(inputs.webDistributionDomainName)
  const cloudflareApiCnameTarget = pulumi.output(inputs.apiTargetDomainName)

  if (!inputs.manageRoute53) {
    return {
      hostedZoneId: undefined,
      nameServers: undefined,
      cloudflareWebCnameTarget,
      cloudflareApiCnameTarget,
      route53WebRecordFqdn: undefined,
      route53ApiRecordFqdn: undefined,
    }
  }

  let zoneId: pulumi.Output<string>
  let nameServers: pulumi.Output<string[]> | undefined

  if (inputs.createHostedZone) {
    const zone = new aws.route53.Zone(getName("zone"), {
      name: inputs.domain,
      comment: "Limetry OSS (Pulumi)",
      tags: getTags("dns"),
    })
    zoneId = zone.zoneId
    nameServers = zone.nameServers
  } else if (inputs.hostedZoneId) {
    zoneId = pulumi.output(inputs.hostedZoneId)
  } else {
    throw new Error(
      "manageRoute53=true requires hostedZoneId or createHostedZone=true",
    )
  }

  const webRecord = new aws.route53.Record(getName("web-a"), {
    zoneId,
    name: inputs.domain,
    type: "A",
    aliases: [
      {
        name: inputs.webDistributionDomainName,
        zoneId: inputs.webDistributionHostedZoneId,
        evaluateTargetHealth: false,
      },
    ],
  })

  new aws.route53.Record(getName("web-www"), {
    zoneId,
    name: `www.${inputs.domain}`,
    type: "A",
    aliases: [
      {
        name: inputs.webDistributionDomainName,
        zoneId: inputs.webDistributionHostedZoneId,
        evaluateTargetHealth: false,
      },
    ],
  })

  let route53ApiRecordFqdn: pulumi.Output<string> | undefined
  if (inputs.createApiAlias && inputs.apiTargetHostedZoneId) {
    const apiRecord = new aws.route53.Record(getName("api-a"), {
      zoneId,
      name: inputs.apiHostname,
      type: "A",
      aliases: [
        {
          name: inputs.apiTargetDomainName,
          zoneId: inputs.apiTargetHostedZoneId,
          evaluateTargetHealth: false,
        },
      ],
    })
    route53ApiRecordFqdn = apiRecord.fqdn
  } else {
    const apiCname = new aws.route53.Record(getName("api-cname"), {
      zoneId,
      name: inputs.apiHostname,
      type: "CNAME",
      ttl: 300,
      records: [pulumi.output(inputs.apiTargetDomainName).apply((value) => {
        const host = value.replace(/^https?:\/\//, "").replace(/\/$/, "")
        return host
      })],
    })
    route53ApiRecordFqdn = apiCname.fqdn
  }

  return {
    hostedZoneId: zoneId,
    nameServers,
    cloudflareWebCnameTarget,
    cloudflareApiCnameTarget,
    route53WebRecordFqdn: webRecord.fqdn,
    route53ApiRecordFqdn,
  }
}
