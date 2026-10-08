import * as pulumi from "@pulumi/pulumi"
import { beforeAll, describe, expect, it } from "vitest"

import { buildCloudProviderConfig } from "./config"
import { createAwsProvider } from "./providers/aws"
import { createAzureProvider } from "./providers/azure"
import { createGcpProvider } from "./providers/gcp"

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

  it("creates an AWS adapter for an external cluster", () => {
    const result = createAwsProvider("aws-test", buildCloudProviderConfig({
      cloudProvider: "aws",
      createRegistry: false,
      kubeconfig: "apiVersion: v1",
    }))

    expect(result.cloudProvider).toBe("aws")
    expect(result.imageRepository).toBe("aws-test-server")
    expect(result.registries).toBeUndefined()
  })

  it("creates a GCP adapter for an external cluster", () => {
    const result = createGcpProvider("gcp-test", buildCloudProviderConfig({
      cloudProvider: "gcp",
      createRegistry: false,
      kubeconfig: "apiVersion: v1",
      registryRepository: "us-central1-docker.pkg.dev/project/api",
    }))

    expect(result.cloudProvider).toBe("gcp")
    expect(result.imageRepository).toBe("us-central1-docker.pkg.dev/project/api")
  })

  it("creates an Azure adapter for an external cluster", () => {
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
