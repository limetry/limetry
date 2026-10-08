import * as neon from "@pulumi/neon"
import * as pulumi from "@pulumi/pulumi"

import type { CloudProviderConfig } from "./config"

/**
 * Creates a Neon project and returns its pooled PostgreSQL connection string.
 *
 * @param name - Logical Limetry resource prefix.
 * @param config - Normalized cloud deployment configuration.
 * @returns Neon connection details and project metadata.
 */
export function createNeonDatabase(name: string, config: CloudProviderConfig): {
  connectionString: pulumi.Output<string>
  projectName: pulumi.Output<string>
} {
  const provider = new neon.Provider(`${name}-neon-provider`, {
    apiKey: config.neonApiKey,
  })
  const project = new neon.Project(`${name}-neon-project`, {
    autoscalingLimitMaxCu: 1,
    autoscalingLimitMinCu: 0.25,
    branch: {
      databaseName: config.neonDatabaseName,
      name: config.neonBranchName,
      roleName: config.neonRoleName,
    },
    name: config.neonProjectName,
    orgId: config.neonOrgId,
    pgVersion: 16,
    regionId: config.neonRegion,
    storePassword: "yes",
    suspendTimeoutSeconds: 300,
  }, { provider })

  return {
    connectionString: pulumi.secret(project.connectionUriPooler),
    projectName: project.name,
  }
}
