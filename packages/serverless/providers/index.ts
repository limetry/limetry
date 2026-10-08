import type { ServerlessProvider } from "../config"
import type { ProviderFactory, ProviderResources } from "./types"

/**
 * Returns the provider implementation selected by configuration.
 *
 * @param provider - Selected serverless provider.
 * @returns Provider resource factory.
 */
export async function getProviderFactory(provider: ServerlessProvider): Promise<ProviderFactory> {
  switch (provider) {
    case "aws":
      return (await import("./aws.js")).createAwsProvider
    case "azure":
      return (await import("./azure.js")).createAzureProvider
    case "gcp":
      return (await import("./gcp.js")).createGcpProvider
  }
}

/**
 * Creates resources with a selected provider factory.
 *
 * @param factory - Provider resource factory.
 * @param args - Shared provider inputs.
 * @returns Provider resources.
 */
export async function createProvider(
  factory: ProviderFactory,
  args: Parameters<ProviderFactory>[0],
): Promise<ProviderResources> {
  return await factory(args)
}
