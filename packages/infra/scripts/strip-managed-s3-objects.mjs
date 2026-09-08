import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

/**
 * Removes per-file S3 objects from a Pulumi stack export so the next `pulumi up`
 * does not DeleteObject them when we switch to bucket sync.
 */
const DROP_TYPES = new Set([
  "aws:s3:BucketObject",
  "aws:s3/bucketObject:BucketObject",
  "aws:s3/bucketObjectv2:BucketObjectv2",
  "synced-folder:index:S3BucketFolder",
  "pulumi:providers:synced-folder",
])

export function stripManagedS3Objects(deployment) {
  const resources = Array.isArray(deployment?.deployment?.resources)
    ? deployment.deployment.resources
    : []
  const dropUrns = new Set(
    resources
      .filter((resource) => DROP_TYPES.has(resource.type))
      .map((resource) => resource.urn),
  )
  const kept = resources.filter((resource) => !dropUrns.has(resource.urn))
  for (const resource of kept) {
    if (Array.isArray(resource.dependencies)) {
      resource.dependencies = resource.dependencies.filter((urn) => !dropUrns.has(urn))
    }
    if (resource.propertyDependencies && typeof resource.propertyDependencies === "object") {
      for (const [key, urns] of Object.entries(resource.propertyDependencies)) {
        resource.propertyDependencies[key] = (urns ?? []).filter((urn) => !dropUrns.has(urn))
      }
    }
  }
  return {
    dropped: dropUrns.size,
    deployment: {
      ...deployment,
      deployment: {
        ...deployment.deployment,
        resources: kept,
      },
    },
  }
}

const isCli = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href
const inputPath = process.argv[2]
const outputPath = process.argv[3]
if (isCli && inputPath && outputPath) {
  const parsed = JSON.parse(readFileSync(inputPath, "utf8"))
  const result = stripManagedS3Objects(parsed)
  writeFileSync(outputPath, `${JSON.stringify(result.deployment)}\n`)
  console.error(`Dropped ${result.dropped} per-file S3 resources from stack export`)
}
