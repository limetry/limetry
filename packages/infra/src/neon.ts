/**
 * Neon serverless Postgres wiring notes for Limetry OSS.
 *
 * This stack does **not** call the Neon Pulumi provider at apply-time by default
 * (the bridged `kislerdm/neon` provider is installed via
 * `pulumi package add terraform-provider kislerdm/neon` when desired).
 *
 * Recommended flow:
 * 1. Create a Neon project/branch in the Neon console (free/launch tier).
 * 2. Copy the pooled connection string.
 * 3. `pulumi config set --secret databaseUrl 'postgresql://...'`
 * 4. Optionally record ids: `pulumi config set neonProjectId ...` / `neonBranchId ...`
 *
 * When you later enable the Neon provider, prefer creating Project + Branch +
 * Database + Role, then writing the resulting connection URI into SSM (see
 * `createSecrets` in secrets.ts) instead of standing up RDS.
 */

/**
 * Install command for the optional bridged Neon Terraform provider.
 */
export const NEON_PROVIDER_INSTALL =
  "pulumi package add terraform-provider kislerdm/neon"

/**
 * Optional Neon project/branch ids from Pulumi config.
 */
export type NeonConfigHints = {
  /**
   * Neon project id when operators recorded it in config.
   */
  projectId: string | undefined
  /**
   * Neon branch id when operators recorded it in config.
   */
  branchId: string | undefined
}

/**
 * Builds a one-line operator summary of Neon wiring for logs and stack exports.
 *
 * @param hints - Optional Neon project and branch ids.
 * @returns Human-readable description including the optional provider install hint.
 */
export function describeNeonConfig(hints: NeonConfigHints): string {
  const parts = [
    "Database: Neon serverless Postgres (connection string in SSM DATABASE_URL).",
  ]
  if (hints.projectId) {
    parts.push(`neonProjectId=${hints.projectId}`)
  }
  if (hints.branchId) {
    parts.push(`neonBranchId=${hints.branchId}`)
  }
  parts.push(`Optional provider: ${NEON_PROVIDER_INSTALL}`)
  return parts.join(" ")
}
