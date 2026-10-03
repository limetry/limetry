/**
 * Resource entry inside a Pulumi stack export.
 */
export type PulumiStackResource = {
  urn: string
  type: string
  dependencies?: string[]
  propertyDependencies?: Record<string, string[]>
}

/**
 * Shape of `pulumi stack export` consumed by the cleanup script.
 */
export type PulumiStackExport = {
  deployment: {
    resources: PulumiStackResource[]
  }
}

/**
 * Drops per-file S3 object resources from a stack export.
 *
 * @param deployment - Parsed `pulumi stack export` document.
 * @returns The filtered export and how many resources were removed.
 */
export function stripManagedS3Objects(deployment: PulumiStackExport): {
  dropped: number
  deployment: PulumiStackExport
}
