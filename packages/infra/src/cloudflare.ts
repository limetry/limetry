import * as aws from "@pulumi/aws"
import * as cloudflare from "@pulumi/cloudflare"
import * as pulumi from "@pulumi/pulumi"

import type { CustomDomainCerts } from "./certificates.js"
import {
  dnsRecordFqdn,
  hostnameFromTarget,
  stripTrailingDot,
} from "./dns-names.js"

export type AcmDnsValidationInputs = {
  certs: CustomDomainCerts
  namePrefix: string
  zoneId: pulumi.Input<string>
}

export type AcmDnsValidationOutputs = {
  apiCertificateArn: pulumi.Output<string>
  webCertificateArn: pulumi.Output<string>
}

export type CloudflareTrafficInputs = {
  apiHostname: string
  apiTargetDomainName: pulumi.Input<string>
  domain: string
  includeWww: boolean
  namePrefix: string
  proxied: boolean
  webDistributionDomainName: pulumi.Input<string>
  zoneId: pulumi.Input<string>
}

export type CloudflareTrafficOutputs = {
  apiRecordFqdn: pulumi.Output<string>
  webRecordFqdn: pulumi.Output<string>
  wwwRecordFqdn: pulumi.Output<string> | undefined
}

/**
 * Looks up a Cloudflare zone by name, or uses an explicit zone id.
 */
export function resolveCloudflareZoneId(
  zoneName: string,
  zoneId: string | undefined,
): pulumi.Output<string> {
  if (zoneId) {
    return pulumi.output(zoneId)
  }
  const zones = cloudflare.getZonesOutput({
    name: zoneName,
    status: "active",
  })
  return zones.results.apply((results) => {
    const zone = results[0]
    if (!zone) {
      throw new Error(
        `Cloudflare zone '${zoneName}' was not found. `
        + "Set limetry-oss:cloudflareZoneId or check CLOUDFLARE_API_TOKEN.",
      )
    }
    return zone.id
  })
}

function uniqueValidationOptions(
  options: readonly {
    resourceRecordName: string
    resourceRecordType: string
    resourceRecordValue: string
  }[],
): {
  resourceRecordName: string
  resourceRecordType: string
  resourceRecordValue: string
}[] {
  const seen = new Set<string>()
  return options.filter((option) => {
    if (seen.has(option.resourceRecordName)) {
      return false
    }
    seen.add(option.resourceRecordName)
    return true
  })
}

function createValidationRecords(
  namePrefix: string,
  kind: string,
  zoneId: pulumi.Input<string>,
  options: pulumi.Output<readonly {
    resourceRecordName: string
    resourceRecordType: string
    resourceRecordValue: string
  }[]>,
): pulumi.Output<cloudflare.DnsRecord[]> {
  return options.apply((rawOptions) =>
    uniqueValidationOptions(rawOptions).map((option, index) =>
      new cloudflare.DnsRecord(`${namePrefix}-${kind}-acm-${index}`, {
        zoneId,
        name: dnsRecordFqdn(option.resourceRecordName),
        type: option.resourceRecordType,
        content: stripTrailingDot(option.resourceRecordValue),
        proxied: false,
        ttl: 60,
        comment: "ACM validation (Pulumi limetry-oss)",
      }),
    ),
  )
}

function createTrafficCname(
  resourceName: string,
  args: {
    comment: string
    hostname: string
    proxied: boolean
    target: pulumi.Input<string>
    zoneId: pulumi.Input<string>
  },
): cloudflare.DnsRecord {
  return new cloudflare.DnsRecord(resourceName, {
    zoneId: args.zoneId,
    name: dnsRecordFqdn(args.hostname),
    type: "CNAME",
    content: pulumi.output(args.target).apply(hostnameFromTarget),
    proxied: args.proxied,
    ttl: args.proxied ? 1 : 300,
    comment: args.comment,
  })
}

/**
 * Writes ACM DNS validation CNAMEs to Cloudflare and waits for issuance.
 */
export function createAcmDnsValidation(
  inputs: AcmDnsValidationInputs,
): AcmDnsValidationOutputs {
  const webValidationRecords = createValidationRecords(
    inputs.namePrefix,
    "web",
    inputs.zoneId,
    inputs.certs.webCertificate.domainValidationOptions,
  )
  const apiValidationRecords = createValidationRecords(
    inputs.namePrefix,
    "api",
    inputs.zoneId,
    inputs.certs.apiCertificate.domainValidationOptions,
  )

  const webValidation = new aws.acm.CertificateValidation(
    `${inputs.namePrefix}-web-cert-validation`,
    {
      certificateArn: inputs.certs.webCertificate.arn,
      validationRecordFqdns: webValidationRecords.apply((records) =>
        records.map((record) => record.name),
      ),
    },
    { provider: inputs.certs.usEast1 },
  )

  const apiValidation = new aws.acm.CertificateValidation(
    `${inputs.namePrefix}-api-cert-validation`,
    {
      certificateArn: inputs.certs.apiCertificate.arn,
      validationRecordFqdns: apiValidationRecords.apply((records) =>
        records.map((record) => record.name),
      ),
    },
  )

  return {
    apiCertificateArn: apiValidation.certificateArn,
    webCertificateArn: webValidation.certificateArn,
  }
}

/**
 * CNAME `dev.limetry.org` (and api / www) to CloudFront and API Gateway.
 */
export function createCloudflareTrafficRecords(
  inputs: CloudflareTrafficInputs,
): CloudflareTrafficOutputs {
  const webRecord = createTrafficCname(`${inputs.namePrefix}-cf-web`, {
    zoneId: inputs.zoneId,
    hostname: inputs.domain,
    target: inputs.webDistributionDomainName,
    proxied: inputs.proxied,
    comment: "CloudFront marketing site (Pulumi limetry-oss)",
  })

  const wwwRecord = inputs.includeWww
    ? createTrafficCname(`${inputs.namePrefix}-cf-web-www`, {
      zoneId: inputs.zoneId,
      hostname: `www.${inputs.domain}`,
      target: inputs.webDistributionDomainName,
      proxied: inputs.proxied,
      comment: "CloudFront www (Pulumi limetry-oss)",
    })
    : undefined

  const apiRecord = createTrafficCname(`${inputs.namePrefix}-cf-api`, {
    zoneId: inputs.zoneId,
    hostname: inputs.apiHostname,
    target: inputs.apiTargetDomainName,
    proxied: inputs.proxied,
    comment: "API Gateway (Pulumi limetry-oss)",
  })

  return {
    apiRecordFqdn: apiRecord.name,
    webRecordFqdn: webRecord.name,
    wwwRecordFqdn: wwwRecord?.name,
  }
}

/**
 * Fails fast when Cloudflare DNS is enabled but no API token is configured.
 */
export function assertCloudflareAuth(): void {
  const config = new pulumi.Config("cloudflare")
  if (config.get("apiToken") || process.env.CLOUDFLARE_API_TOKEN) {
    return
  }
  throw new Error(
    "Cloudflare DNS is enabled. Set CLOUDFLARE_API_TOKEN or "
    + "`pulumi config set --secret cloudflare:apiToken <token>` "
    + "(Zone.DNS Edit + Zone.Read). Disable with limetry-oss:manageCloudflare false.",
  )
}
