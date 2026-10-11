/**
 * Cloudflare DNS upsert via API for ACM validation records.
 *
 * Updates records by zone + FQDN + type so stale Pulumi/Cloudflare record ids
 * (404 on PUT) are healed without manual state surgery.
 */

import * as pulumi from "@pulumi/pulumi"

import { dnsRecordFqdn } from "./dns-names.js"

type CloudflareDnsUpsertArgs = {
  zoneId: string
  name: string
  type: string
  content: string
  ttl: number
  comment?: string
}

type CloudflareDnsRecordResult = {
  id: string
  name: string
}

type CloudflareApiResponse<T> = {
  success: boolean
  result: T
  errors: Array<{ code: number, message: string }>
}

function cloudflareApiToken(): string {
  const config = new pulumi.Config("cloudflare")
  const token = config.get("apiToken") ?? process.env.CLOUDFLARE_API_TOKEN
  if (!token) {
    throw new Error(
      "Cloudflare API token is required for DNS upsert (cloudflare:apiToken or CLOUDFLARE_API_TOKEN)",
    )
  }
  return token
}

async function cloudflareRequest<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${cloudflareApiToken()}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = (await response.json()) as CloudflareApiResponse<T>
  if (!json.success) {
    const detail = json.errors.map((error) => error.message).join("; ")
    throw new Error(`Cloudflare API ${method} ${path} failed: ${detail}`)
  }
  return json.result
}

async function findRecord(
  zoneId: string,
  name: string,
  type: string,
): Promise<CloudflareDnsRecordResult | undefined> {
  const fqdn = dnsRecordFqdn(name)
  const encoded = encodeURIComponent(fqdn)
  const results = await cloudflareRequest<CloudflareDnsRecordResult[]>(
    "GET",
    `/zones/${zoneId}/dns_records?type=${encodeURIComponent(type)}&name=${encoded}`,
  )
  return results[0]
}

async function upsertRecord(args: CloudflareDnsUpsertArgs): Promise<CloudflareDnsRecordResult> {
  const fqdn = dnsRecordFqdn(args.name)
  const payload = {
    type: args.type,
    name: fqdn,
    content: args.content,
    ttl: args.ttl,
    proxied: false,
    comment: args.comment,
  }
  const existing = await findRecord(args.zoneId, fqdn, args.type)
  if (existing) {
    return cloudflareRequest<CloudflareDnsRecordResult>(
      "PUT",
      `/zones/${args.zoneId}/dns_records/${existing.id}`,
      payload,
    )
  }
  return cloudflareRequest<CloudflareDnsRecordResult>(
    "POST",
    `/zones/${args.zoneId}/dns_records`,
    payload,
  )
}

async function deleteRecord(zoneId: string, name: string, type: string): Promise<void> {
  const existing = await findRecord(zoneId, name, type)
  if (!existing) {
    return
  }
  try {
    await cloudflareRequest<{ id: string }>(
      "DELETE",
      `/zones/${zoneId}/dns_records/${existing.id}`,
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes("81044") || message.includes("Record does not exist")) {
      return
    }
    throw error
  }
}

const cloudflareDnsUpsertProvider: pulumi.dynamic.ResourceProvider = {
  async create(inputs: CloudflareDnsUpsertArgs) {
    const record = await upsertRecord(inputs)
    return {
      id: `${inputs.zoneId}/${record.id}`,
      outs: {
        ...inputs,
        name: dnsRecordFqdn(record.name),
        recordId: record.id,
      },
    }
  },
  async update(_id: string, _olds: CloudflareDnsUpsertArgs, news: CloudflareDnsUpsertArgs) {
    const record = await upsertRecord(news)
    return {
      outs: {
        ...news,
        name: dnsRecordFqdn(record.name),
        recordId: record.id,
      },
    }
  },
  async delete(_id: string, props: CloudflareDnsUpsertArgs) {
    await deleteRecord(props.zoneId, props.name, props.type)
  },
  async diff(_id, olds: CloudflareDnsUpsertArgs, news: CloudflareDnsUpsertArgs) {
    const replaces: string[] = []
    if (olds.zoneId !== news.zoneId) {
      replaces.push("zoneId")
    }
    if (dnsRecordFqdn(olds.name) !== dnsRecordFqdn(news.name)) {
      replaces.push("name")
    }
    if (olds.type !== news.type) {
      replaces.push("type")
    }
    if (replaces.length > 0) {
      return { changes: true, replaces }
    }
    return {
      changes: olds.content !== news.content
        || olds.ttl !== news.ttl
        || olds.comment !== news.comment,
    }
  },
}

/**
 * DNS-only Cloudflare record upserted by FQDN (immune to stale record ids).
 */
export class CloudflareDnsUpsert extends pulumi.dynamic.Resource {
  declare public readonly name: pulumi.Output<string>

  constructor(
    resourceName: string,
    args: CloudflareDnsUpsertArgs,
    opts?: pulumi.CustomResourceOptions,
  ) {
    super(
      cloudflareDnsUpsertProvider,
      resourceName,
      {
        ...args,
        name: dnsRecordFqdn(args.name),
      },
      opts,
    )
  }
}

/**
 * Creates or adopts an ACM validation record via Cloudflare API upsert.
 */
export function upsertValidationDnsRecord(
  resourceName: string,
  args: CloudflareDnsUpsertArgs,
  opts?: pulumi.CustomResourceOptions,
): CloudflareDnsUpsert {
  return new CloudflareDnsUpsert(resourceName, args, opts)
}
