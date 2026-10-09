import * as cloudflare from "@pulumi/cloudflare"
import * as pulumi from "@pulumi/pulumi"

import type { ServerlessDnsRecord } from "./providers/types"

/**
 * Normalizes a DNS record hostname to an absolute FQDN without a trailing dot.
 *
 * @param value - Relative or absolute DNS name.
 * @returns Lowercase FQDN.
 */
export function normalizeDnsName(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "")
    .toLowerCase()
}

/**
 * Resolves a Cloudflare zone id from an explicit id or an active zone name.
 *
 * @param zoneName - Cloudflare zone name.
 * @param zoneId - Optional explicit zone id.
 * @returns Zone id as a Pulumi output.
 */
export function resolveCloudflareZoneId(
  zoneName: string,
  zoneId?: string,
): pulumi.Output<string> {
  if (zoneId) {
    return pulumi.output(zoneId)
  }

  return cloudflare.getZonesOutput({
    name: zoneName,
    status: "active",
  }).results.apply((zones) => {
    const zone = zones[0]
    if (!zone) {
      throw new Error(`Cloudflare zone "${zoneName}" was not found`)
    }
    return zone.id
  })
}

/**
 * Verifies that Cloudflare DNS management has credentials.
 *
 * @throws When neither Pulumi config nor the environment contains a token.
 */
export function assertCloudflareAuth(): void {
  const config = new pulumi.Config("cloudflare")
  if (config.get("apiToken")) {
    return
  }
  throw new Error(
    "Cloudflare DNS is enabled. Set `pulumi config set --secret cloudflare:apiToken <token>`.",
  )
}

/**
 * Creates or adopts DNS-only Cloudflare records for a provider custom domain.
 *
 * @param name - Pulumi resource prefix.
 * @param zoneId - Cloudflare zone id.
 * @param records - Validation and traffic records.
 * @returns Managed record names.
 */
export function createCloudflareDnsRecords(
  name: string,
  zoneId: pulumi.Input<string>,
  records: pulumi.Input<ServerlessDnsRecord[]>,
): pulumi.Output<string[]> {
  return pulumi.all([zoneId, records]).apply(async ([resolvedZoneId, resolvedRecords]) => {
    const seen = new Set<string>()
    const recordNames: string[] = []

    for (const [index, record] of resolvedRecords.entries()) {
      const recordName = normalizeDnsName(String(record.name))
      const key = `${record.type}:${recordName}`
      if (seen.has(key)) {
        continue
      }
      seen.add(key)

      const existing = await cloudflare.getDnsRecords({
        maxItems: 1,
        name: { exact: recordName },
        type: record.type,
        zoneId: resolvedZoneId,
      })
      new cloudflare.DnsRecord(`${name}-dns-${index}`, {
        comment: "Limetry serverless custom domain",
        content: record.content,
        name: recordName,
        proxied: false,
        ttl: record.ttl ?? 300,
        type: record.type,
        zoneId: resolvedZoneId,
      }, {
        deleteBeforeReplace: true,
        ...(existing.results[0]?.id ? { import: existing.results[0].id } : {}),
      })
      recordNames.push(recordName)
    }

    return recordNames
  })
}
