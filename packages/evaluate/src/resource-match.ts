/**
 * Matches a resource string against a policy pattern.
 *
 * A wildcard matches the prefix before the first wildcard, preserving the
 * evaluator's existing policy semantics.
 *
 * @param resource - Concrete resource identifier.
 * @param pattern - Pattern, optionally containing `*`.
 * @returns Whether the resource matches.
 */
export function matchesResourcePattern(resource: string, pattern: string): boolean {
  const wildcardIndex = pattern.indexOf("*")
  if (wildcardIndex >= 0) {
    return resource.startsWith(pattern.slice(0, wildcardIndex))
  }
  return resource === pattern
}
