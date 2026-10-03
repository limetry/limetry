import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { stripManagedS3Objects } from "../scripts/strip-managed-s3-objects.mjs"

describe("stripManagedS3Objects", () => {
  it("drops per-file S3 objects and synced-folder resources from a stack export", () => {
    const result = stripManagedS3Objects({
      deployment: {
        resources: [
          { urn: "urn:pulumi:dev::limetry-oss::aws:s3/bucket:Bucket::web", type: "aws:s3/bucket:Bucket" },
          {
            urn: "urn:pulumi:dev::limetry-oss::aws:s3/bucketObject:BucketObject::index",
            type: "aws:s3/bucketObject:BucketObject",
          },
          {
            urn: "urn:pulumi:dev::limetry-oss::synced-folder:index:S3BucketFolder::web-sync",
            type: "synced-folder:index:S3BucketFolder",
          },
          {
            urn: "urn:pulumi:dev::limetry-oss::pulumi:providers:synced-folder::default",
            type: "pulumi:providers:synced-folder",
          },
          {
            urn: "urn:pulumi:dev::limetry-oss::aws:s3/bucketPolicy:BucketPolicy::web-policy",
            type: "aws:s3/bucketPolicy:BucketPolicy",
            dependencies: [
              "urn:pulumi:dev::limetry-oss::aws:s3/bucket:Bucket::web",
              "urn:pulumi:dev::limetry-oss::synced-folder:index:S3BucketFolder::web-sync",
            ],
            propertyDependencies: {
              bucket: ["urn:pulumi:dev::limetry-oss::aws:s3/bucket:Bucket::web"],
              policy: ["urn:pulumi:dev::limetry-oss::synced-folder:index:S3BucketFolder::web-sync"],
            },
          },
        ],
      },
    })

    assert.equal(result.dropped, 3)
    assert.deepEqual(
      result.deployment.deployment.resources.map((resource) => resource.type),
      ["aws:s3/bucket:Bucket", "aws:s3/bucketPolicy:BucketPolicy"],
    )
    const policy = result.deployment.deployment.resources[1]
    assert.ok(policy)
    assert.deepEqual(policy.dependencies, [
      "urn:pulumi:dev::limetry-oss::aws:s3/bucket:Bucket::web",
    ])
    assert.ok(policy.propertyDependencies)
    assert.deepEqual(policy.propertyDependencies.policy, [])
  })
})
