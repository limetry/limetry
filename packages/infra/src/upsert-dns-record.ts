/**
 * Cloudflare DNS record upsert with hard-coded DNS-only (`proxied: false`).
 *
 * TLS and CDN terminate on AWS (ACM + CloudFront / API Gateway). Orange-cloud
 * CNAMEs to those targets are intentionally unsupported.
 *
 * When a matching zone+name+type record already exists in Cloudflare, adopts it
 * via `import` instead of POSTing a duplicate (Cloudflare error 81053).
 */

import * as cloudflare from "@pulumi/cloudflare"
import * as pulumi from "@pulumi/pulumi"

import { dnsRecordFqdn } from "./dns-names.js"
import { getDeploymentId } from "./tags.js"

/**
 * Arguments for a Cloudflare DNS record managed by Pulumi.
 */
export type UpsertDnsRecordArgs = {
  /**
   * Cloudflare zone id.
   */
  zoneId: pulumi.Input<string>
  /**
   * Record name (relative or FQDN); normalized via {@link dnsRecordFqdn}.
   */
  name: pulumi.Input<string>
  /**
   * DNS record type (for example `CNAME`).
   */
  type: pulumi.Input<string>
  /**
   * Record content (CNAME target, TXT value, etc.).
   */
  content: pulumi.Input<string>
  /**
   * TTL in seconds (used when `proxied` is false).
   */
  ttl: pulumi.Input<number>
  /**
   * Optional operator-facing comment stored on the record.
   */
  comment?: pulumi.Input<string>
}

/**
 * Pulumi options plus optional legacy name alias for in-place renames.
 */
export type UpsertDnsRecordOptions = pulumi.CustomResourceOptions & {
  /**
   * Logical name used before project-resource-stack renaming
   * (`${project}-${stack}-${suffix}`). Enables state rename instead of
   * create+delete when the Cloudflare record is already managed.
   */
  legacySuffix?: string
  /**
   * Existing Cloudflare DNS record id to import on first adopt.
   */
  importId?: string
}

/**
 * Legacy Pulumi logical name: `${project}-${stack}-${suffix}`.
 *
 * @param suffix - Resource suffix such as `cf-web` or `web-acm-0`.
 * @returns Deployment-scoped legacy resource name.
 */
export function legacyDnsResourceName(suffix: string): string {
  return `${getDeploymentId()}-${suffix}`
}

/**
 * Looks up a Cloudflare DNS record id by zone, exact name, and type.
 *
 * @param zoneId - Cloudflare zone id.
 * @param name - Record hostname (relative or FQDN).
 * @param type - DNS record type (e.g. `CNAME`).
 * @returns Record id when a match exists; otherwise `undefined`.
 */
export async function findDnsRecordId(
  zoneId: string,
  name: string,
  type: string,
): Promise<string | undefined> {
  const result = await cloudflare.getDnsRecords({
    zoneId,
    name: { exact: dnsRecordFqdn(name) },
    type,
    maxItems: 1,
  })
  return result.results[0]?.id
}

/**
 * Manages a Cloudflare DNS record as DNS-only (`proxied: false`).
 *
 * Uses Pulumi aliases for renames and optional `importId` so existing Cloudflare
 * records are updated in place instead of create+delete (error 81053).
 *
 * @param resourceName - Canonical Pulumi resource name (`getName(...)`).
 * @param args - Zone, name, type, content, and TTL.
 * @param opts - Optional aliases / legacy suffix and other resource options.
 * @returns The managed `cloudflare.DnsRecord` with grey-cloud proxying.
 */
export function upsertDnsRecord(
  resourceName: string,
  args: UpsertDnsRecordArgs,
  opts?: UpsertDnsRecordOptions,
): cloudflare.DnsRecord {
  const aliases: pulumi.Input<pulumi.URN | pulumi.Alias>[] = [
    ...(opts?.aliases ?? []),
  ]
  if (opts?.legacySuffix) {
    aliases.push({ name: legacyDnsResourceName(opts.legacySuffix) })
  }

  const {
    legacySuffix: _legacySuffix,
    aliases: _aliases,
    importId,
    ...restOpts
  } = opts ?? {}

  return new cloudflare.DnsRecord(
    resourceName,
    {
      zoneId: args.zoneId,
      name: pulumi.output(args.name).apply(dnsRecordFqdn),
      type: args.type,
      content: args.content,
      ttl: args.ttl,
      proxied: false,
      comment: args.comment,
    },
    {
      ...restOpts,
      aliases,
      deleteBeforeReplace: true,
      ...(importId ? { import: importId } : {}),
    },
  )
}

/**
 * Adopts an existing Cloudflare record when present, otherwise creates one.
 *
 * @param resourceName - Pulumi logical resource name.
 * @param args - Concrete zone id plus record fields.
 * @param opts - Optional aliases / legacy suffix.
 * @returns Cloudflare `DnsRecord` (imported or newly created).
 */
export async function upsertDnsRecordAdopting(
  resourceName: string,
  args: {
    zoneId: string
    name: string
    type: string
    content: string
    ttl: number
    comment?: string
  },
  opts?: Omit<UpsertDnsRecordOptions, "importId">,
): Promise<cloudflare.DnsRecord> {
  const importId = await findDnsRecordId(args.zoneId, args.name, args.type)
  return upsertDnsRecord(
    resourceName,
    {
      zoneId: args.zoneId,
      name: args.name,
      type: args.type,
      content: args.content,
      ttl: args.ttl,
      comment: args.comment,
    },
    {
      ...opts,
      importId,
    },
  )
}
