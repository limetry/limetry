import * as pulumi from "@pulumi/pulumi"
import { beforeAll, describe, expect, it } from "vitest"

import { buildCloudProviderConfig } from "./config"
import { createAwsProvider } from "./providers/aws"
import { createAzureProvider } from "./providers/azure"
import { createGcpProvider } from "./providers/gcp"

/** Verifies provider adapters expose a common Kubernetes workload contract. */
describe("cloud provider adapters", () => {
  beforeAll(() => {
    pulumi.runtime.setMocks({
      newResource: (args) => ({
        id: `${args.type}::${args.name}`,
        state: args.inputs,
      }),
      call: (args) => args.inputs,
    })
  })

  /** Verifies the AWS adapter in externally managed cluster mode. */
  it("creates an AWS adapter for an external cluster", () => {
    /** AWS provider resources returned by the adapter. */
    const result = createAwsProvider("aws-test", buildCloudProviderConfig({
      cloudProvider: "aws",
      createRegistry: false,
      kubeconfig: "apiVersion: v1",
    }))

    expect(result.cloudProvider).toBe("aws")
    expect(result.imageRepository).toBe("aws-test-server")
    expect(result.registries).toBeUndefined()
  })

  /** Verifies the GCP adapter in externally managed cluster mode. */
  it("creates a GCP adapter for an external cluster", () => {
    /** GCP provider resources returned by the adapter. */
    const result = createGcpProvider("gcp-test", buildCloudProviderConfig({
      cloudProvider: "gcp",
      createRegistry: false,
      kubeconfig: "apiVersion: v1",
      registryRepository: "us-central1-docker.pkg.dev/project/api",
    }))

    expect(result.cloudProvider).toBe("gcp")
    expect(result.imageRepository).toBe("us-central1-docker.pkg.dev/project/api")
  })

  /** Verifies the Azure adapter in externally managed cluster mode. */
  it("creates an Azure adapter for an external cluster", () => {
    /** Azure provider resources returned by the adapter. */
    const result = createAzureProvider("azure-test", buildCloudProviderConfig({
      cloudProvider: "azure",
      createRegistry: false,
      kubeconfig: "apiVersion: v1",
      registryRepository: "registry.example.test/api",
    }))

    expect(result.cloudProvider).toBe("azure")
    expect(result.imageRepository).toBe("registry.example.test/api")
    expect(result.registries).toBeUndefined()
  })
})
