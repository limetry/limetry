const LOAD_TEST_STACK_PREFIXES = ["load-target-", "load-test-"]

export const DEFAULT_LOAD_TEST_PROTECTED_STACK_NAMES = ["dev", "prod"] as const

export const DEFAULT_LOAD_TEST_PROTECTED_HOSTNAMES = [
  "api.dev.limetry.com",
  "api.limetry.com",
  "api.dev.limetry.org",
  "api.limetry.org",
  "dev.limetry.org",
  "limetry.org",
  "www.limetry.org",
] as const

export function parseLoadTestList(value: string | undefined): string[] {
  return [...new Set(
    (value ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  )]
}

export function assertLoadTestStackSafety(input: {
  apiHostname: string
  domain: string
  isLoadTestApiOnly: boolean
  protectedHostnames?: readonly string[]
  protectedStackNames?: readonly string[]
  stackName: string
}): void {
  if (!input.isLoadTestApiOnly) {
    return
  }

  const stackName = input.stackName.trim().toLowerCase().split("/").at(-1) ?? ""
  const protectedStackNames = new Set([
    ...DEFAULT_LOAD_TEST_PROTECTED_STACK_NAMES,
    ...(input.protectedStackNames ?? []),
  ].map((name) => name.trim().toLowerCase()))
  if (protectedStackNames.has(stackName)) {
    throw new Error(
      `isLoadTestApiOnly cannot be enabled on protected Pulumi stack "${input.stackName}".`,
    )
  }

  if (!LOAD_TEST_STACK_PREFIXES.some((prefix) => stackName.startsWith(prefix))) {
    throw new Error(
      "isLoadTestApiOnly requires a Pulumi stack name beginning with load-target- or load-test-.",
    )
  }

  const protectedHostnames = new Set([
    ...DEFAULT_LOAD_TEST_PROTECTED_HOSTNAMES,
    ...(input.protectedHostnames ?? []),
  ].map((hostname) => hostname.trim().toLowerCase()))
  const configuredHostnames = [input.apiHostname, input.domain]
    .map((hostname) => hostname.trim().toLowerCase())
  const conflictingHostname = configuredHostnames.find((hostname) => (
    hostname && protectedHostnames.has(hostname)
  ))
  if (conflictingHostname) {
    throw new Error(
      `isLoadTestApiOnly cannot use protected hostname "${conflictingHostname}".`,
    )
  }
}

export function assertLoadTestDatabaseUrl(
  url: string,
  protectedDatabaseHosts: readonly string[],
): string {
  let hostname: string
  try {
    hostname = new URL(url).hostname.toLowerCase()
  } catch {
    throw new Error("databaseUrl is not a valid URL.")
  }

  const protectedHosts = protectedDatabaseHosts
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean)
  if (protectedHosts.length === 0) {
    throw new Error(
      "isLoadTestApiOnly requires loadTestProtectedDatabaseHosts.",
    )
  }
  if (protectedHosts.includes(hostname)) {
    throw new Error(
      `isLoadTestApiOnly cannot use protected database host "${hostname}".`,
    )
  }
  return url
}
