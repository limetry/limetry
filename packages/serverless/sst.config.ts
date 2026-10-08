export default $config({
  app(input) {
    return {
      name: "limetry-serverless",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: "7.20.0",
        azure: "6.40.0",
        "azure-native": "3.28.0",
        "docker-build": "0.0.22",
        gcp: "10.1.0",
      },
    }
  },
  async run() {
    const { resolve } = await import("node:path")
    const { randomBytes } = await import("node:crypto")
    const { buildServerEnvironment, buildServerlessConfig } = await import("./config")
    const { createProvider, getProviderFactory } = await import("./providers")

    /** Normalized deployment configuration from LIMETRY_* environment variables. */
    const config = buildServerlessConfig(process.env)

    /** Repository root used by the Lambda bundle and container image builders. */
    const repoRoot = resolve(process.cwd(), "../..")

    /**
     * Resolves an explicitly supplied secret or generates an encrypted stack secret.
     *
     * @param environmentKey - Environment variable suffix.
     * @param length - Generated secret length in bytes.
     * @returns Secret output consumed by the runtime.
     */
    function resolveSecret(
      environmentKey: string,
      length: number,
    ): import("@pulumi/pulumi").Output<string> {
      const configured = process.env[`LIMETRY_${environmentKey}`]
      if (configured) {
        return $util.secret(configured)
      }
      return $util.secret(randomBytes(length).toString("base64url"))
    }

    /** Bearer token used by the API's machine-to-machine authentication middleware. */
    const bearerToken = resolveSecret("BEARER_TOKEN", 48)

    /** JWT signing secret used by the API token endpoints. */
    const jwtSecret = resolveSecret("JWT_SECRET", 64)

    /** HMAC secret used to sign and verify policy decision receipts. */
    const decisionHmacSecret = resolveSecret("DECISION_HMAC_SECRET", 64)

    /** Database password created only when AWS RDS is selected. */
    const databasePassword = config.databaseProvider === "rds"
      ? resolveSecret("DATABASE_PASSWORD", 40)
      : $util.secret("")
    const neonApiKey = process.env.LIMETRY_NEON_API_KEY ?? process.env.NEON_API_KEY
      ? $util.secret(process.env.LIMETRY_NEON_API_KEY ?? process.env.NEON_API_KEY ?? "")
      : undefined

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
        neonApiKey,
      },
    }

    /** Provider-specific serverless resources. */
    const providerFactory = await getProviderFactory(config.cloudProvider)
    const provider = await createProvider(providerFactory, providerArgs)

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
      databaseMode: config.databaseProvider,
      docsUrl,
      openApiJsonUrl,
      openApiYamlUrl,
      ...(provider.dnsRecords ? { dnsRecords: provider.dnsRecords } : {}),
      ...(provider.managedDatabaseConnection
        ? { databaseConnection: provider.managedDatabaseConnection }
        : {}),
    }
  },
})
