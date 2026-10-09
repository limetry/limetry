import type * as pulumi from "@pulumi/pulumi"

import type { ServerEnvironment, ServerlessConfig } from "../config"

/** DNS record types emitted by provider-native custom-domain resources. */
export type ServerlessDnsRecordType = "A" | "AAAA" | "CNAME" | "TXT"

/** DNS record required to validate or route a custom API hostname. */
export type ServerlessDnsRecord = {
  content: pulumi.Input<string>
  name: pulumi.Input<string>
  ttl?: pulumi.Input<number>
  type: ServerlessDnsRecordType
}

/** Inputs shared by every serverless provider adapter. */
export type ServerlessProviderArgs = {
  environment: ServerEnvironment
  name: string
  repoRoot: string
  secrets: {
    bearerToken: pulumi.Input<string>
    databasePassword: pulumi.Input<string>
    databaseUrl?: pulumi.Input<string>
    decisionHmacSecret: pulumi.Input<string>
    jwtSecret: pulumi.Input<string>
    neonApiKey?: pulumi.Input<string>
  }
  config: ServerlessConfig
}

/** Outputs shared by every serverless provider adapter. */
export type ServerlessProviderResources = {
  apiUrl: pulumi.Output<string>
  apiImageReference: pulumi.Input<string>
  apiDnsRecords?: pulumi.Input<ServerlessDnsRecord[]>
  managedDatabaseConnection?: pulumi.Output<string>
}

/** Factory for a provider-specific serverless deployment. */
export type ServerlessProviderFactory = (
  args: ServerlessProviderArgs,
) => ServerlessProviderResources
