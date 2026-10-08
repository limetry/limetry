import "./.sst/platform/config.d.ts"

export default $config({
  app(input) {
    return {
      name: "limetry-serverless",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        gcp: { package: "@pulumi/gcp", version: "10.1.0" },
        azure: { package: "@pulumi/azure", version: "6.40.0" },
        "azure-native": { package: "@pulumi/azure-native", version: "3.28.0" },
        "docker-build": { package: "@pulumi/docker-build", version: "0.0.22" },
        random: { package: "@pulumi/random", version: "4.21.2" },
      },
    }
  },
  async run() {
    const { resolve } = await import("node:path")
    const { fileURLToPath } = await import("node:url")
    const { buildServerEnvironment, buildServerlessConfig } = await import("./config")
    const { createProvider, getProviderFactory } = await import("./providers")

    /** Normalized deployment configuration from LIMETRY_* environment variables. */
    const config = buildServerlessConfig(process.env)

    /** Repository root used by the Lambda bundle and container image builders. */
    const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)))

    /**
     * Resolves an explicitly supplied secret or generates an encrypted stack secret.
     *
     * @param key - Pulumi resource suffix.
     * @param environmentKey - Optional explicit environment variable suffix.
     * @param length - Generated secret length.
     * @returns Secret output consumed by the runtime.
     */
    function resolveSecret(
      key: string,
      environmentKey: string,
      length: number,
    ): import("@pulumi/pulumi").Output<string> {
      const configured = process.env[`LIMETRY_${environmentKey}`]
      if (configured) {
        return $util.secret(configured)
      }
      const generated = new random.RandomPassword(`limetry-${key}`, {
        length,
        special: false,
      })
      return generated.result
    }

    /** Bearer token used by the API's machine-to-machine authentication middleware. */
    const bearerToken = resolveSecret("bearerToken", "BEARER_TOKEN", 48)

    /** JWT signing secret used by the API token endpoints. */
    const jwtSecret = resolveSecret("jwtSecret", "JWT_SECRET", 64)

    /** HMAC secret used to sign and verify policy decision receipts. */
    const decisionHmacSecret = resolveSecret("decisionHmacSecret", "DECISION_HMAC_SECRET", 64)

    /** Database password created only when managed PostgreSQL is enabled. */
    const databasePassword = config.managedDatabase
      ? resolveSecret("databasePassword", "DATABASE_PASSWORD", 40)
      : $util.secret("")

    /** Environment variables shared by all provider adapters. */
    const environment = buildServerEnvironment(config, {
      bearerToken,
      decisionHmacSecret,
      jwtSecret,
    })

    /** Inputs shared by the selected provider implementation. */
    const providerArgs = {
      config,
      environment,
      name: `limetry-${config.cloudProvider}`,
      repoRoot,
      secrets: {
        bearerToken,
        databasePassword,
        decisionHmacSecret,
        jwtSecret,
      },
    }

    /** Provider-specific serverless resources. */
    const provider = createProvider(getProviderFactory(config.cloudProvider), providerArgs)

    /** Public API origin without a trailing slash. */
    const apiUrl = provider.apiUrl.apply((value) => value.replace(/\/+$/, ""))

    /** Versioned API documentation URL. */
    const docsUrl = $util.interpolate`${apiUrl}/v1/docs`

    /** Versioned OpenAPI JSON URL. */
    const openApiJsonUrl = $util.interpolate`${apiUrl}/v1/openapi.json`

    /** Versioned OpenAPI YAML URL. */
    const openApiYamlUrl = $util.interpolate`${apiUrl}/v1/openapi.yaml`

    return {
      apiImageReference: provider.apiImageReference,
      apiUrl,
      cloudProvider: config.cloudProvider,
      databaseMode: config.managedDatabase ? "managed-postgres" : "sqlite",
      databaseConnection: provider.managedDatabaseConnection ?? $util.secret(""),
      dnsRecords: provider.dnsRecords ?? [],
      docsUrl,
      openApiJsonUrl,
      openApiYamlUrl,
    }
  },
})
