import type { ServerlessProvider } from "../config"
import { createAwsProvider } from "./aws"
import { createAzureProvider } from "./azure"
import { createGcpProvider } from "./gcp"
import type { ServerlessProviderFactory, ServerlessProviderResources } from "./types"

/**
 * Selects the configured serverless provider adapter.
 *
 * @param provider - Normalized serverless provider identifier.
 * @returns Provider-specific deployment factory.
 */
export function getServerlessProviderFactory(provider: ServerlessProvider): ServerlessProviderFactory {
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
 * Creates the selected serverless provider resources.
 *
 * @param factory - Provider-specific deployment factory.
 * @param args - Shared deployment inputs.
 * @returns Provider-specific serverless resources.
 */
export function createServerlessProvider(
  factory: ServerlessProviderFactory,
  args: Parameters<ServerlessProviderFactory>[0],
): ServerlessProviderResources {
  return factory(args)
}
