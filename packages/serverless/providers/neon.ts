import * as neon from "@pulumi/neon"
import * as pulumi from "@pulumi/pulumi"

import type { ProviderArgs } from "./types.js"

/**
 * Creates a Neon project and returns its pooled PostgreSQL connection string.
 *
 * @param args - Shared serverless deployment inputs.
 * @returns Neon connection details.
 */
export function createNeonDatabase(args: ProviderArgs): {
  connectionString: pulumi.Output<string>
  host: pulumi.Output<string>
} {
  const provider = new neon.Provider(`${args.name}-neon-provider`, {
    apiKey: args.secrets.neonApiKey,
  })
  const project = new neon.Project(`${args.name}-neon-project`, {
    autoscalingLimitMaxCu: 1,
    autoscalingLimitMinCu: 0.25,
    branch: {
      databaseName: args.config.neonDatabaseName,
      name: args.config.neonBranchName,
      roleName: args.config.neonRoleName,
    },
    historyRetentionSeconds: 21600,
    name: args.config.neonProjectName,
    orgId: args.config.neonOrgId,
    pgVersion: 16,
    regionId: args.config.neonRegion,
    storePassword: "yes",
  }, { provider })

  return {
    connectionString: pulumi.secret(project.connectionUriPooler),
    host: project.databaseHostPooler,
  }
}
