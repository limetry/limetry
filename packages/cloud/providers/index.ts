import type { CloudProviderConfig } from "../config"
import { createAwsProvider } from "./aws"
import { createAzureProvider } from "./azure"
import { createGcpProvider } from "./gcp"
import type { CloudProviderFactory, CloudProviderResources } from "./types"

/**
 * Selects the configured cloud provider implementation.
 *
 * @param name - Logical Limetry resource prefix.
 * @param config - Normalized cloud provider configuration.
 * @returns Resources used by the shared Kubernetes workload.
 */
export function createCloudProvider(
  name: string,
  config: CloudProviderConfig,
): CloudProviderResources {
  return getCloudProviderFactory(config.cloudProvider)(name, config)
}

/**
 * Returns the adapter for one supported cloud provider.
 *
 * @param cloudProvider - Provider identifier from normalized configuration.
 * @returns Provider resource factory.
 */
export function getCloudProviderFactory(cloudProvider: CloudProviderConfig["cloudProvider"]): CloudProviderFactory {
  switch (cloudProvider) {
    case "aws":
      return createAwsProvider
    case "azure":
      return createAzureProvider
    case "gcp":
      return createGcpProvider
  }
}
