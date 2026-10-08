import { describe, expect, it } from "vitest"

import {
  API_PORT,
  API_VERSION,
  buildApiDnsAnnotations,
  buildApiDocumentationUrls,
  buildApiImageTag,
  buildApiUrl,
  buildCloudProviderConfig,
  buildSecretResourceName,
  normalizeApiDomain,
  parseCloudProvider,
  resolvePersistence,
} from "./config"
import { createAwsProvider } from "./providers/aws"
import { createAzureProvider } from "./providers/azure"
import { createGcpProvider } from "./providers/gcp"
import { getCloudProviderFactory } from "./providers/index"

/** Verifies cloud stack configuration helpers and provider selection. */
describe("cloud stack configuration", () => {
  /** Verifies API domain normalization. */
  it("normalizes configured API domains", () => {
    expect(normalizeApiDomain("https://api.example.test/")).toBe("api.example.test")
    expect(normalizeApiDomain("  api.example.test  ")).toBe("api.example.test")
    expect(normalizeApiDomain("")).toBeUndefined()
    expect(normalizeApiDomain("https://")).toBeUndefined()
  })

  /** Verifies default and explicit image references. */
  it("builds stable image references with stack defaults", () => {
    expect(buildApiImageTag("limetry", "dev")).toBe("limetry-server:pulumi-dev")
    expect(buildApiImageTag("limetry", "dev", "registry.example/limetry/api", "branch-7"))
      .toBe("registry.example/limetry/api:branch-7")
  })

  /** Verifies DNS annotations are emitted only for configured domains. */
  it("builds DNS annotations only for configured domains", () => {
    expect(buildApiDnsAnnotations(undefined, "limetry.org")).toEqual({})
    expect(buildApiDnsAnnotations("api.example.test", "example.test")).toEqual({
      "external-dns.alpha.kubernetes.io/hostname": "api.example.test",
      "external-dns.alpha.kubernetes.io/ttl": "300",
      "limetry.org/api-domain-zone": "example.test",
    })
  })

  /** Verifies configured API domains enable Cloudflare DNS management. */
  it("normalizes API domain configuration", () => {
    expect(buildCloudProviderConfig({
      apiDomain: "https://api.example.com/",
    })).toMatchObject({
      apiDomain: "api.example.com",
      apiDomainZone: "example.com",
      manageCloudflare: true,
    })
  })

  /** Verifies configured and provider-assigned API URLs. */
  it("builds configured and provider-assigned API URLs", () => {
    expect(buildApiUrl("api.example.test", undefined)).toBe("https://api.example.test")
    expect(buildApiUrl(undefined, "203.0.113.10")).toBe("http://203.0.113.10")
    expect(buildApiUrl(undefined, undefined)).toBeUndefined()
  })

  /** Verifies versioned API documentation URLs. */
  it("builds versioned API documentation URLs", () => {
    expect(buildApiDocumentationUrls(undefined)).toBeUndefined()
    expect(buildApiDocumentationUrls("https://api.example.test")).toEqual({
      docs: "https://api.example.test/v1/docs",
      openApiJson: "https://api.example.test/v1/openapi.json",
      openApiYaml: "https://api.example.test/v1/openapi.yaml",
    })
  })

  /** Verifies supported persistence modes. */
  it("resolves the supported storage modes", () => {
    expect(resolvePersistence(false)).toBe("sqlite")
    expect(resolvePersistence(true)).toBe("postgres")
  })

  /** Verifies supported and unsupported cloud provider identifiers. */
  it("parses supported cloud providers and rejects unsupported values", () => {
    expect(parseCloudProvider(undefined)).toBe("aws")
    expect(parseCloudProvider("gcp")).toBe("gcp")
    expect(parseCloudProvider("azure")).toBe("azure")
    expect(() => parseCloudProvider("digitalocean")).toThrow("Unsupported cloudProvider")
  })

  /** Verifies cloud provider factory selection. */
  it("selects the matching cloud provider factory", () => {
    expect(getCloudProviderFactory("aws")).toBe(createAwsProvider)
    expect(getCloudProviderFactory("gcp")).toBe(createGcpProvider)
    expect(getCloudProviderFactory("azure")).toBe(createAzureProvider)
  })

  /** Verifies provider-specific default locations and machine types. */
  it("builds provider-specific defaults", () => {
    expect(buildCloudProviderConfig({ cloudProvider: "aws" })).toMatchObject({
      cloudProvider: "aws",
      createCluster: false,
      createRegistry: false,
      location: "us-west-2",
      nodeCount: 2,
      nodeMachineType: "t3.medium",
    })
    expect(buildCloudProviderConfig({ cloudProvider: "gcp" })).toMatchObject({
      location: "us-central1",
      nodeMachineType: "e2-medium",
    })
    expect(buildCloudProviderConfig({ cloudProvider: "azure" })).toMatchObject({
      location: "westus2",
      nodeMachineType: "Standard_D2s_v5",
    })
  })

  /** Verifies provider node sizing validation. */
  it("validates provider node sizing", () => {
    expect(() => buildCloudProviderConfig({ nodeCount: 0 })).toThrow("nodeCount")
    expect(() => buildCloudProviderConfig({ nodeCount: 1.5 })).toThrow("nodeCount")
    expect(buildCloudProviderConfig({
      cloudProvider: "azure",
      nodeCount: 3,
      resourceGroupName: "shared-rg",
    })).toMatchObject({
      nodeCount: 3,
      resourceGroupName: "shared-rg",
    })
  })

  /** Verifies stable API version and generated secret resource contracts. */
  it("keeps fixed API version and secret resource contracts", () => {
    expect(API_PORT).toBe(3810)
    expect(API_VERSION).toBe("v1")
    expect(buildSecretResourceName("limetry", "decisionHmacSecret"))
      .toBe("limetry-decisionHmacSecret")
  })
})
