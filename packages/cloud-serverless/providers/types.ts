import type * as pulumi from "@pulumi/pulumi"

import type { ServerEnvironment,ServerlessConfig } from "../config"

/** Inputs shared by every serverless provider adapter. */
export type ServerlessProviderArgs = {
  environment: ServerEnvironment
  name: string
  repoRoot: string
  secrets: {
    bearerToken: pulumi.Input<string>
    databasePassword: pulumi.Input<string>
    decisionHmacSecret: pulumi.Input<string>
    jwtSecret: pulumi.Input<string>
  }
  config: ServerlessConfig
}

/** Outputs shared by every serverless provider adapter. */
export type ServerlessProviderResources = {
  apiUrl: pulumi.Output<string>
  apiImageReference: pulumi.Input<string>
  managedDatabaseConnection?: pulumi.Output<string>
}

/** Factory for a provider-specific serverless deployment. */
export type ServerlessProviderFactory = (
  args: ServerlessProviderArgs,
) => ServerlessProviderResources
