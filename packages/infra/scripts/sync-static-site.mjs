import { createHash } from "node:crypto"
import { createReadStream, existsSync, readdirSync, statSync } from "node:fs"
import { extname, join, relative } from "node:path"

import { CloudFrontClient, CreateInvalidationCommand } from "@aws-sdk/client-cloudfront"
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
}

function contentTypeFor(filePath) {
  return CONTENT_TYPES[extname(filePath).toLowerCase()] ?? "application/octet-stream"
}

function cacheControlFor(key) {
  if (key.startsWith("_next/static/")) {
    return "public, max-age=31536000, immutable"
  }
  // HTML and RSC payloads use a short cache window because deploys invalidate
  // CloudFront. This avoids a network revalidation on every navigation.
  // Extensionless keys are mirrors of `*.html` for deep links.
  if (
    key.endsWith(".html")
    || key === "index.html"
    || key.endsWith(".txt")
    || (!key.includes(".") && !key.startsWith("_next/"))
  ) {
    return "public, max-age=60, stale-while-revalidate=300"
  }
  return "public, max-age=3600"
}

function listLocalFiles(root) {
  if (!existsSync(root)) {
    return []
  }
  const files = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.isFile()) {
        files.push(fullPath)
      }
    }
  }
  walk(root)
  return files
}

function resolveAwsRegion(explicitRegion) {
  return explicitRegion
    || process.env.AWS_REGION
    || process.env.AWS_DEFAULT_REGION
    || "us-west-2"
}

async function listRemoteKeys(client, bucket) {
  const keys = []
  let token
  do {
    const page = await client.send(new ListObjectsV2Command({
      Bucket: bucket,
      ContinuationToken: token,
    }))
    for (const object of page.Contents ?? []) {
      if (object.Key) {
        keys.push(object.Key)
      }
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined
  } while (token)
  return keys
}

async function putObject(client, bucket, key, filePath) {
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: createReadStream(filePath),
    ContentType: contentTypeFor(filePath),
    CacheControl: cacheControlFor(key),
    ContentLength: statSync(filePath).size,
  }))
}

/**
 * Next `output: "export"` writes `pricing.html`. CloudFront/S3 requests for
 * `/pricing` miss that key and the SPA 404→index.html fallback serves Home.
 * Mirror each `*.html` (except index.html) to an extensionless key so deep
 * links and hard refreshes resolve the real page.
 */
function extensionlessHtmlKey(key) {
  if (!key.endsWith(".html") || key === "index.html" || key.endsWith("/index.html")) {
    return undefined
  }
  return key.slice(0, -".html".length)
}

async function syncBucket(bucket, distDir, region) {
  const client = new S3Client({
    region,
    followRegionRedirects: true,
  })
  const localFiles = listLocalFiles(distDir)
  const desiredKeys = new Set()

  for (const filePath of localFiles) {
    const key = relative(distDir, filePath).split("\\").join("/")
    desiredKeys.add(key)
    await putObject(client, bucket, key, filePath)

    const alias = extensionlessHtmlKey(key)
    if (alias) {
      desiredKeys.add(alias)
      await putObject(client, bucket, alias, filePath)
    }
  }

  const remoteKeys = await listRemoteKeys(client, bucket)
  // Keep prior `/_next/static/*` objects. Cached HTML (especially iOS Safari)
  // may still reference the previous build's hashed chunks; deleting them while
  // CloudFront maps 404→index.html poisons script URLs as text/html and blanks
  // the page for non-private tabs that still have the old document.
  const stale = remoteKeys.filter((key) => {
    if (desiredKeys.has(key)) {
      return false
    }
    return !key.startsWith("_next/static/")
  })
  for (let index = 0; index < stale.length; index += 1000) {
    const chunk = stale.slice(index, index + 1000)
    await client.send(new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: chunk.map((Key) => ({ Key })),
        Quiet: true,
      },
    }))
  }

  return { uploaded: desiredKeys.size, deleted: stale.length }
}

async function invalidate(distributionId) {
  const client = new CloudFrontClient({ region: "us-west-2" })
  const result = await client.send(new CreateInvalidationCommand({
    DistributionId: distributionId,
    InvalidationBatch: {
      CallerReference: `pulumi-${createHash("sha256").update(`${distributionId}-${Date.now()}`).digest("hex").slice(0, 16)}`,
      Paths: {
        Quantity: 1,
        Items: ["/*"],
      },
    },
  }))
  return result.Invalidation?.Id ?? "ok"
}

const bucket = process.argv[2]
const distDir = process.argv[3]
const distributionId = process.argv[4]
const region = resolveAwsRegion(process.argv[5])

if (!bucket || !distDir) {
  console.error("Usage: node sync-static-site.mjs <bucket> <dist-dir> [distribution-id] [region]")
  process.exit(1)
}

const result = await syncBucket(bucket, distDir, region)
console.log(`Synced s3://${bucket} region=${region} uploaded=${result.uploaded} deleted=${result.deleted}`)
if (distributionId) {
  const invalidationId = await invalidate(distributionId)
  console.log(`Invalidated ${distributionId} (${invalidationId})`)
}
