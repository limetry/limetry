import type { ServerlessProvider } from "../config"
import { createAwsProvider } from "./aws"
import { createAzureProvider } from "./azure"
import { createGcpProvider } from "./gcp"
import type { ProviderFactory, ProviderResources } from "./types"

/**
 * Returns the provider implementation selected by configuration.
 *
 * @param provider - Selected serverless provider.
 * @returns Provider resource factory.
 */
export function getProviderFactory(provider: ServerlessProvider): ProviderFactory {
  switch (provider) {
    case "aws":
      return createAwsProvider
    case "azure":
      return createAzureProvider
    case "gcp":
      return createGcpProvider
  }
}

/**
 * Creates resources with a selected provider factory.
 *
 * @param factory - Provider resource factory.
 * @param args - Shared provider inputs.
 * @returns Provider resources.
 */
export function createProvider(
  factory: ProviderFactory,
  args: Parameters<ProviderFactory>[0],
): ProviderResources {
  return factory(args)
}
