/**
 * Pure configuration helpers for the cloud-agnostic Limetry Kubernetes stack.
 */

/** Fixed HTTP port exposed by the OSS server container image. */
export const API_PORT = 3810

/** Public API route version used by the OSS server. */
export const API_VERSION = "v1"

/** Persistence backends supported by the cloud-agnostic API deployment. */
export type PersistenceMode = "postgres" | "sqlite"

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

  return normalized.length > 0 ? normalized : undefined
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
