import * as cloudflare from "@pulumi/cloudflare"
import * as pulumi from "@pulumi/pulumi"

/**
 * Normalizes a provider hostname to an absolute DNS name.
 *
 * @param value - Provider hostname or URL.
 * @returns Lowercase hostname without a trailing dot.
 */
export function normalizeDnsName(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "")
    .toLowerCase()
}

/**
 * Creates or adopts a DNS-only Cloudflare record for a Kubernetes service.
 *
 * @param resourceName - Pulumi resource name.
 * @param zoneId - Cloudflare zone id.
 * @param apiDomain - Public API hostname.
 * @param serviceAddress - Provider load-balancer address.
 * @returns Managed Cloudflare record name.
 */
export function createCloudflareApiRecord(
  resourceName: string,
  zoneId: pulumi.Input<string>,
  apiDomain: string,
  serviceAddress: pulumi.Output<string | undefined>,
): pulumi.Output<string> {
  return pulumi.all([zoneId, serviceAddress]).apply(async ([resolvedZoneId, address]) => {
    if (!address) {
      throw new Error("The Kubernetes API Service has no load-balancer address yet")
    }

    const normalizedAddress = normalizeDnsName(address)
    const isIpAddress = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(normalizedAddress)
    const type = isIpAddress ? "A" : "CNAME"
    const existing = await cloudflare.getDnsRecords({
      maxItems: 1,
      name: { exact: normalizeDnsName(apiDomain) },
      type,
      zoneId: resolvedZoneId,
    })

    new cloudflare.DnsRecord(resourceName, {
      comment: "Limetry Kubernetes API",
      content: normalizedAddress,
      name: normalizeDnsName(apiDomain),
      proxied: false,
      ttl: 300,
      type,
      zoneId: resolvedZoneId,
    }, {
      deleteBeforeReplace: true,
      ...(existing.results[0]?.id ? { import: existing.results[0].id } : {}),
    })

    return normalizeDnsName(apiDomain)
  })
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
  if (config.get("apiToken") || process.env.CLOUDFLARE_API_TOKEN) {
    return
  }
  throw new Error(
    "Cloudflare DNS is enabled. Set CLOUDFLARE_API_TOKEN or "
    + "`pulumi config set --secret cloudflare:apiToken <token>`",
  )
}
