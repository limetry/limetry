import type * as pulumi from "@pulumi/pulumi"

import type { ServerEnvironment, ServerlessConfig, ServerlessProvider } from "../config"

/** DNS record types emitted by provider custom-domain resources. */
export type DnsRecordType = "A" | "CNAME" | "TXT"

/** DNS record required to validate or route a custom API hostname. */
export type DnsRecord = {
  content: pulumi.Input<string>
  name: pulumi.Input<string>
  ttl?: pulumi.Input<number>
  type: DnsRecordType
}

/** Shared inputs passed to each provider implementation. */
export type ProviderArgs = {
  config: ServerlessConfig
  environment: ServerEnvironment
  name: string
  repoRoot: string
  secrets: {
    bearerToken: pulumi.Input<string>
    databasePassword: pulumi.Input<string>
    decisionHmacSecret: pulumi.Input<string>
    jwtSecret: pulumi.Input<string>
    neonApiKey?: pulumi.Input<string>
  }
}

/** Shared outputs returned by each provider implementation. */
export type ProviderResources = {
  apiImageReference: pulumi.Input<string>
  apiUrl: pulumi.Output<string>
  dnsRecords?: pulumi.Input<DnsRecord[]>
  managedDatabaseConnection?: pulumi.Output<string>
  managedDatabaseHost?: pulumi.Output<string>
  provider: ServerlessProvider
}

/** Factory for a provider-specific deployment. */
export type ProviderFactory = (args: ProviderArgs) => Promise<ProviderResources>
