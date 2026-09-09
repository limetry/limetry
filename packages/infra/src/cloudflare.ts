/**
 * Cloudflare DNS-only helpers for ACM validation and traffic CNAMEs.
 *
 * All records go through {@link upsertDnsRecord}, which hardcodes
 * `proxied: false` (grey cloud). TLS terminates on ACM + CloudFront / API
 * Gateway, never on the Cloudflare proxy.
 */

import * as aws from "@pulumi/aws"
import * as cloudflare from "@pulumi/cloudflare"
import * as pulumi from "@pulumi/pulumi"

import type { CustomDomainCerts } from "./certificates.js"
import {
  dnsRecordFqdn,
  hostnameFromTarget,
  stripTrailingDot,
} from "./dns-names.js"
import { getName } from "./tags.js"
import { upsertDnsRecord, upsertDnsRecordAdopting } from "./upsert-dns-record.js"

/**
 * Inputs for writing ACM DNS validation records into Cloudflare.
 */
export type AcmDnsValidationInputs = {
  /**
   * Web (us-east-1) and API (stack region) certificates awaiting validation.
   */
  certs: CustomDomainCerts
  /**
   * Cloudflare zone id that receives the validation CNAMEs.
   */
  zoneId: pulumi.Input<string>
}

/**
 * Issued certificate ARNs after Cloudflare DNS validation succeeds.
 */
export type AcmDnsValidationOutputs = {
  /**
   * Validated regional ACM ARN for API Gateway.
   */
  apiCertificateArn: pulumi.Output<string>
  /**
   * Validated us-east-1 ACM ARN for CloudFront.
   */
  webCertificateArn: pulumi.Output<string>
}

/**
 * Inputs for apex / www / API traffic CNAMEs to AWS edge targets.
 */
export type CloudflareTrafficInputs = {
  /**
   * API hostname that CNAMEs to API Gateway.
   */
  apiHostname: string
  /**
   * API Gateway regional domain name (CNAME content).
   */
  apiTargetDomainName: pulumi.Input<string>
  /**
   * Marketing apex hostname that CNAMEs to CloudFront.
   */
  domain: string
  /**
   * When true, also manage `www.${domain}`.
   */
  includeWww: boolean
  /**
   * CloudFront distribution domain name (CNAME content).
   */
  webDistributionDomainName: pulumi.Input<string>
  /**
   * Cloudflare zone id for the traffic records.
   */
  zoneId: pulumi.Input<string>
}

/**
 * FQDNs of the managed DNS-only traffic records.
 */
export type CloudflareTrafficOutputs = {
  /**
   * API CNAME record name.
   */
  apiRecordFqdn: pulumi.Output<string>
  /**
   * Apex (or preview) web CNAME record name.
   */
  webRecordFqdn: pulumi.Output<string>
  /**
   * Optional www CNAME record name when `includeWww` is true.
   */
  wwwRecordFqdn: pulumi.Output<string> | undefined
}

/**
 * Looks up a Cloudflare zone by name, or uses an explicit zone id.
 *
 * @param zoneName - Zone hostname used when `zoneId` is omitted.
 * @param zoneId - Explicit zone id that bypasses the lookup.
 * @returns Zone id Output suitable for `cloudflare.DnsRecord`.
 * @throws When the named zone is not found under the configured token.
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

/**
 * Deduplicates ACM validation options by `resourceRecordName`.
 *
 * AWS may return duplicate names for apex + www SANs.
 *
 * @param options - Raw ACM domain validation options.
 * @returns Options with unique `resourceRecordName` values.
 */
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

/**
 * Creates DNS-only Cloudflare records for ACM certificate validation.
 *
 * Dedupes by FQDN across kinds and adopts existing Cloudflare records so a
 * shared SAN hostname is not POSTed twice (error 81053).
 *
 * @param zoneId - Cloudflare zone id.
 * @param webOptions - Web cert `domainValidationOptions`.
 * @param apiOptions - API cert `domainValidationOptions`.
 * @returns Records keyed for web and API certificate validation.
 */
function createSharedValidationRecords(
  zoneId: pulumi.Input<string>,
  webOptions: pulumi.Output<readonly {
    resourceRecordName: string
    resourceRecordType: string
    resourceRecordValue: string
  }[]>,
  apiOptions: pulumi.Output<readonly {
    resourceRecordName: string
    resourceRecordType: string
    resourceRecordValue: string
  }[]>,
): pulumi.Output<{
  api: cloudflare.DnsRecord[]
  web: cloudflare.DnsRecord[]
}> {
  return pulumi
    .all([zoneId, webOptions, apiOptions])
    .apply(async ([zid, webRaw, apiRaw]) => {
      const byFqdn = new Map<string, cloudflare.DnsRecord>()

      const adoptGroup = async (
        kind: string,
        rawOptions: readonly {
          resourceRecordName: string
          resourceRecordType: string
          resourceRecordValue: string
        }[],
      ): Promise<cloudflare.DnsRecord[]> => {
        const records: cloudflare.DnsRecord[] = []
        let createIndex = 0
        for (const option of uniqueValidationOptions(rawOptions)) {
          const fqdn = dnsRecordFqdn(option.resourceRecordName)
          const existing = byFqdn.get(fqdn)
          if (existing) {
            records.push(existing)
            continue
          }

          const suffix = `${kind}-acm-${createIndex}`
          const record = await upsertDnsRecordAdopting(
            getName(suffix),
            {
              zoneId: zid,
              name: fqdn,
              type: option.resourceRecordType,
              content: stripTrailingDot(option.resourceRecordValue),
              ttl: 60,
              comment: "ACM validation (Pulumi limetry-oss)",
            },
            { legacySuffix: suffix },
          )
          byFqdn.set(fqdn, record)
          records.push(record)
          createIndex += 1
        }
        return records
      }

      const web = await adoptGroup("web", webRaw)
      const api = await adoptGroup("api", apiRaw)
      return { web, api }
    })
}

/**
 * Creates a DNS-only CNAME to an AWS edge hostname.
 *
 * @param resourceName - Canonical Pulumi resource name.
 * @param legacySuffix - Suffix for state rename aliases.
 * @param args - Zone, hostname, target, and comment.
 * @returns Managed Cloudflare DNS record with `proxied: false`.
 */
function createTrafficCname(
  resourceName: string,
  legacySuffix: string,
  args: {
    comment: string
    hostname: string
    target: pulumi.Input<string>
    zoneId: pulumi.Input<string>
  },
): cloudflare.DnsRecord {
  return upsertDnsRecord(
    resourceName,
    {
      zoneId: args.zoneId,
      name: dnsRecordFqdn(args.hostname),
      type: "CNAME",
      content: pulumi.output(args.target).apply(hostnameFromTarget),
      ttl: 300,
      comment: args.comment,
    },
    { legacySuffix },
  )
}

/**
 * Writes ACM DNS validation CNAMEs to Cloudflare and waits for issuance.
 *
 * @param inputs - Certificates and Cloudflare zone id.
 * @returns Validated web and API certificate ARNs.
 */
export function createAcmDnsValidation(
  inputs: AcmDnsValidationInputs,
): AcmDnsValidationOutputs {
  const validationRecords = createSharedValidationRecords(
    inputs.zoneId,
    inputs.certs.webCertificate.domainValidationOptions,
    inputs.certs.apiCertificate.domainValidationOptions,
  )

  const webValidation = new aws.acm.CertificateValidation(
    getName("web-cert-validation"),
    {
      certificateArn: inputs.certs.webCertificate.arn,
      validationRecordFqdns: validationRecords.apply((records) =>
        records.web.map((record) => record.name),
      ),
    },
    {
      provider: inputs.certs.usEast1,
      deleteBeforeReplace: false,
    },
  )

  const apiValidation = new aws.acm.CertificateValidation(
    getName("api-cert-validation"),
    {
      certificateArn: inputs.certs.apiCertificate.arn,
      validationRecordFqdns: validationRecords.apply((records) =>
        records.api.map((record) => record.name),
      ),
    },
    { deleteBeforeReplace: false },
  )

  return {
    apiCertificateArn: apiValidation.certificateArn,
    webCertificateArn: webValidation.certificateArn,
  }
}

/**
 * CNAMEs apex (and optional www / api) to CloudFront and API Gateway as DNS-only.
 *
 * @param inputs - Hostnames, AWS edge targets, and Cloudflare zone id.
 * @returns FQDNs of the created traffic records.
 */
export function createCloudflareTrafficRecords(
  inputs: CloudflareTrafficInputs,
): CloudflareTrafficOutputs {
  const webRecord = createTrafficCname(getName("cf-web"), "cf-web", {
    zoneId: inputs.zoneId,
    hostname: inputs.domain,
    target: inputs.webDistributionDomainName,
    comment: "CloudFront marketing site (Pulumi limetry-oss)",
  })

  const wwwRecord = inputs.includeWww
    ? createTrafficCname(getName("cf-web-www"), "cf-web-www", {
      zoneId: inputs.zoneId,
      hostname: `www.${inputs.domain}`,
      target: inputs.webDistributionDomainName,
      comment: "CloudFront www (Pulumi limetry-oss)",
    })
    : undefined

  const apiRecord = createTrafficCname(getName("cf-api"), "cf-api", {
    zoneId: inputs.zoneId,
    hostname: inputs.apiHostname,
    target: inputs.apiTargetDomainName,
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
 *
 * Accepts `cloudflare:apiToken` Pulumi config or `CLOUDFLARE_API_TOKEN`.
 *
 * @returns Nothing when auth is present.
 * @throws When neither token source is configured.
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
