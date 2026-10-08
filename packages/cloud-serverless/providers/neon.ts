import * as neon from "@pulumi/neon"
import * as pulumi from "@pulumi/pulumi"

import type { ServerlessProviderArgs as ProviderArgs } from "./types"

/**
 * Creates a Neon project and returns its pooled PostgreSQL connection string.
 *
 * @param args - Shared serverless deployment inputs.
 * @returns Neon connection details.
 */
export function createNeonDatabase(args: ProviderArgs): {
  connectionString: pulumi.Output<string>
} {
  if (args.secrets.databaseUrl) {
    return {
      connectionString: pulumi.secret(args.secrets.databaseUrl),
    }
  }

  if (!args.secrets.neonApiKey) {
    throw new Error(
      "databaseProvider=neon requires neonApiKey or DATABASE_URL. Set Pulumi neonApiKey, NEON_API_KEY, or DATABASE_URL.",
    )
  }

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
    name: args.config.neonProjectName,
    orgId: args.config.neonOrgId,
    pgVersion: 16,
    regionId: args.config.neonRegion,
    storePassword: "yes",
    suspendTimeoutSeconds: 300,
  }, { provider })

  return {
    connectionString: pulumi.secret(project.connectionUriPooler),
  }
}
