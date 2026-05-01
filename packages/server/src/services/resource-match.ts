/**
 * Prefix matching for ActionPolicy resource allow/block/approval patterns.
 */

/**
 * Matches a resource string against a policy pattern.
 *
 * A single `*` in the pattern is treated as a prefix wildcard (match by
 * `startsWith` of the prefix before `*`). Patterns without `*` require equality.
 *
 * @param resource - Intent resource identifier.
 * @param pattern - Policy pattern, optionally containing `*`.
 * @returns Whether the resource matches the pattern.
 */
export function matchesResourcePattern(resource: string, pattern: string): boolean {
  const wildcardIndex = pattern.indexOf("*")
  if (wildcardIndex >= 0) {
    return resource.startsWith(pattern.slice(0, wildcardIndex))
  }
  return resource === pattern
}
