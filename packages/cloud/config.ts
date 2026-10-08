import type * as pulumi from "@pulumi/pulumi"

/**
 * Pure configuration helpers for the cloud-agnostic Limetry Kubernetes stack.
 */

/** Fixed HTTP port exposed by the OSS server container image. */
export const API_PORT = 3810

/** Public API route version used by the OSS server. */
export const API_VERSION = "v1"

/** Managed Kubernetes clouds supported by the cloud deployment stack. */
export type CloudProvider = "aws" | "gcp" | "azure"

/** Supported managed Kubernetes provider identifiers. */
export const CLOUD_PROVIDERS: CloudProvider[] = ["aws", "gcp", "azure"]

/** Persistence backends supported by the cloud-agnostic API deployment. */
export type PersistenceMode = "postgres" | "sqlite"

/** Configuration needed to select a managed or externally managed cluster. */
export type CloudProviderConfig = {
  clusterName: string
  cloudProvider: CloudProvider
  apiDomain?: string
  apiDomainZone: string
  cloudflareZoneId?: string
  manageCloudflare: boolean
  createCluster: boolean
  createRegistry: boolean
  location: string
  kubeconfig?: pulumi.Input<string>
  nodeCount: number
  nodeMachineType: string
  resourceGroupName?: string
  registryRepository?: string
}

/**
 * Parses a cloud provider identifier from Pulumi configuration.
 *
 * @param value - Raw provider configuration.
 * @returns A supported provider identifier.
 */
export function parseCloudProvider(value: string | undefined): CloudProvider {
  if (value === "aws" || value === "gcp" || value === "azure") {
    return value
  }
  if (value) {
    throw new Error(`Unsupported cloudProvider "${value}". Use aws, gcp, or azure.`)
  }
  return "aws"
}

/**
 * Builds portable provider settings from string and boolean config values.
 *
 * @param values - Raw Pulumi configuration values.
 * @returns Normalized provider settings.
 */
export function buildCloudProviderConfig(values: {
  apiDomain?: string
  apiDomainZone?: string
  cloudflareZoneId?: string
  manageCloudflare?: boolean
  cloudProvider?: string
  createCluster?: boolean
  createRegistry?: boolean
  clusterName?: string
  location?: string
  kubeconfig?: pulumi.Input<string>
  nodeCount?: number
  nodeMachineType?: string
  resourceGroupName?: string
  registryRepository?: string
}): CloudProviderConfig {
  const cloudProvider = parseCloudProvider(values.cloudProvider)
  const defaults = {
    azure: { location: "westus2", machineType: "Standard_D2s_v5" },
    aws: { location: "us-west-2", machineType: "t3.medium" },
    gcp: { location: "us-central1", machineType: "e2-medium" },
  }[cloudProvider]

  const nodeCount = values.nodeCount ?? 2
  if (!Number.isInteger(nodeCount) || nodeCount < 1) {
    throw new Error("nodeCount must be a positive integer")
  }

  const location = values.location?.trim() || defaults.location
  if (location.length === 0) {
    throw new Error("location must not be empty")
  }

  const apiDomain = normalizeApiDomain(values.apiDomain)
  const manageCloudflare = values.manageCloudflare ?? Boolean(apiDomain)
  if (apiDomain && !manageCloudflare) {
    throw new Error("manageCloudflare must be true when apiDomain is configured")
  }

  return {
    apiDomain,
    apiDomainZone: inferDnsZone(values.apiDomainZone ?? values.apiDomain),
    cloudflareZoneId: values.cloudflareZoneId?.trim() || undefined,
    manageCloudflare,
    cloudProvider,
    createCluster: values.createCluster ?? false,
    createRegistry: values.createRegistry ?? false,
    clusterName: values.clusterName?.trim() || `limetry-${cloudProvider}`,
    location,
    kubeconfig: typeof values.kubeconfig === "string"
      ? values.kubeconfig.trim() || undefined
      : values.kubeconfig,
    nodeCount,
    nodeMachineType: values.nodeMachineType?.trim() || defaults.machineType,
    resourceGroupName: values.resourceGroupName?.trim() || undefined,
    registryRepository: values.registryRepository?.trim() || undefined,
  }
}

/**
 * Infers a Cloudflare zone from a hostname or zone value.
 *
 * @param value - API hostname or explicit zone.
 * @returns Two-label DNS zone.
 */
function inferDnsZone(value: string | undefined): string {
  const normalized = value?.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "")
  if (!normalized) {
    return "limetry.org"
  }
  return normalized.split(".").slice(-2).join(".").toLowerCase()
}

/**
 * Removes an optional scheme and trailing slash from a configured hostname.
 *
 * @param value - Raw API domain from Pulumi config.
 * @returns Hostname suitable for a Kubernetes DNS annotation, or `undefined`.
 */
export function normalizeApiDomain(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  const normalized = value
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")

  if (normalized.length === 0) {
    return undefined
  }
  if (!/^(?=.{1,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(normalized)) {
    throw new Error("apiDomain must be a valid DNS hostname")
  }
  return normalized.toLowerCase()
}

/**
 * Builds the image reference used by the API Deployment.
 *
 * @param name - Pulumi project resource name.
 * @param stack - Pulumi stack name.
 * @param repository - Optional registry repository.
 * @param tag - Optional image tag override.
 * @returns A Docker image tag.
 */
export function buildApiImageTag(
  name: string,
  stack: string,
  repository?: string,
  tag?: string,
): string {
  const imageTag = tag?.trim() || `pulumi-${stack}`
  const imageRepository = repository?.trim() || `${name}-server`
  return `${imageRepository}:${imageTag}`
}

/**
 * Builds standard ExternalDNS metadata for an API service.
 *
 * @param apiDomain - Optional public API hostname.
 * @param apiDomainZone - DNS zone used by the operator-managed deployment.
 * @returns Kubernetes annotations.
 */
export function buildApiDnsAnnotations(
  apiDomain: string | undefined,
  apiDomainZone: string,
): Record<string, string> {
  if (!apiDomain) {
    return {}
  }

  return {
    "external-dns.alpha.kubernetes.io/hostname": apiDomain,
    "external-dns.alpha.kubernetes.io/ttl": "300",
    "limetry.org/api-domain-zone": apiDomainZone,
  }
}

/**
 * Builds the public API origin from a configured domain or a load-balancer address.
 *
 * @param apiDomain - Optional configured hostname.
 * @param serviceAddress - Provider-assigned load-balancer hostname or IP.
 * @returns Public API origin, or `undefined` until a load balancer is assigned.
 */
export function buildApiUrl(
  apiDomain: string | undefined,
  serviceAddress: string | undefined,
): string | undefined {
  if (apiDomain) {
    return `https://${apiDomain}`
  }
  if (serviceAddress) {
    return `http://${serviceAddress}`
  }
  return undefined
}

/**
 * Builds the versioned API documentation URLs for a public API origin.
 *
 * @param apiUrl - Public API origin without a trailing slash.
 * @returns Versioned documentation URLs, or `undefined` while no origin exists.
 */
export function buildApiDocumentationUrls(apiUrl: string | undefined): {
  docs: string
  openApiJson: string
  openApiYaml: string
} | undefined {
  if (!apiUrl) {
    return undefined
  }

  return {
    docs: `${apiUrl}/${API_VERSION}/docs`,
    openApiJson: `${apiUrl}/${API_VERSION}/openapi.json`,
    openApiYaml: `${apiUrl}/${API_VERSION}/openapi.yaml`,
  }
}

/**
 * Resolves the configured persistence mode.
 *
 * @param usePostgres - Whether the deployment uses the Postgres store.
 * @returns The selected persistence mode.
 */
export function resolvePersistence(usePostgres: boolean): PersistenceMode {
  return usePostgres ? "postgres" : "sqlite"
}

/**
 * Builds a stable Pulumi resource name for a generated secret.
 *
 * @param name - Pulumi project resource name.
 * @param secretName - Logical secret key.
 * @returns Stable resource name.
 */
export function buildSecretResourceName(name: string, secretName: string): string {
  return `${name}-${secretName.replace(/[^a-zA-Z0-9-]/g, "-")}`
}
