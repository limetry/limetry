/**
 * Lambda + API Gateway HTTP API factory for `\@limetry/server`.
 *
 * Deploys a Node 24 Lambda from the prebuilt artifact directory, fronts it with
 * an HTTP API (`$default` proxy), and optionally attaches a regional custom
 * domain when `apiCertificateArn` is provided. No VPC / NAT — Neon and optional
 * Upstash are reached over the public internet.
 */

import { existsSync } from "node:fs"

import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi"

import { resolveArtifactDir } from "./artifacts.js"
import { getName, getSsmParameterPrefix, getTags } from "./tags.js"

/**
 * Inputs for {@link createApi}.
 */
export type ApiInputs = {
  /**
   * Custom API hostname when a certificate ARN is supplied.
   */
  apiHostname: string
  /**
   * Marketing site hostname used for Docs links on the API landing page.
   */
  webHostname: string
  /**
   * `"true"` or `"false"` for Cloud links on the API landing page.
   */
  isCloudEnabled: string
  /** `"true"` enables public Cloud and auth links after launch. */
  launchingSoon: string
  /**
   * Relative path to the Lambda artifact directory.
   */
  serverArtifactPath: string
  /**
   * Postgres connection string (`DATABASE_URL`).
   */
  databaseUrl: pulumi.Input<string>
  /**
   * JWT signing secret.
   */
  jwtSecret: pulumi.Input<string>
  /**
   * API bearer token.
   */
  bearerToken: pulumi.Input<string>
  /**
   * Decision receipt HMAC secret.
   */
  decisionHmacSecret: pulumi.Input<string>
  /**
   * Replay window milliseconds.
   */
  replayWindowMs: pulumi.Input<string>
  /**
   * Per-minute throttle ceiling.
   */
  throttleMaxRequestsPerMinute: pulumi.Input<string>
  /**
   * Default audit mode (`minimal` / `forensics`).
   */
  defaultAuditMode: pulumi.Input<string>
  /**
   * Audit retention days.
   */
  auditRetentionDays: pulumi.Input<string>
  /**
   * Optional auth signing private key (hex).
   */
  authSigningPrivateKeyHex: pulumi.Input<string> | undefined
  /**
   * Optional Redis URL.
   */
  redisUrl: pulumi.Input<string> | undefined
  /**
   * Regional ACM certificate ARN for the custom domain; omit for execute-api only.
   */
  apiCertificateArn: pulumi.Input<string> | undefined
  /**
   * Optional Sentry DSN for the Lambda runtime.
   */
  sentryDsn: string | undefined
  /**
   * Optional PostHog API key for the Lambda runtime.
   */
  posthogPublicProjectToken: string | undefined
  /**
   * PostHog host origin for the Lambda runtime.
   */
  posthogHost: string | undefined
}

/**
 * Outputs from {@link createApi}.
 */
export type ApiOutputs = {
  /**
   * Lambda function ARN.
   */
  lambdaArn: pulumi.Output<string>
  /**
   * Lambda function name (for CloudWatch dimensions).
   */
  lambdaFunctionName: pulumi.Output<string>
  /**
   * CloudWatch log group name for the function.
   */
  logGroupName: pulumi.Output<string>
  /**
   * Public API endpoint (custom HTTPS or stage invoke URL).
   */
  apiEndpoint: pulumi.Output<string>
  /**
   * HTTP API id.
   */
  httpApiId: pulumi.Output<string>
  /**
   * `$default` stage invoke URL.
   */
  invokeUrl: pulumi.Output<string>
  /**
   * Regional domain name for DNS CNAMEs / aliases.
   */
  regionalDomainName: pulumi.Output<string>
  /**
   * Route53 hosted zone id for alias records when a custom domain exists.
   */
  regionalHostedZoneId: pulumi.Output<string> | undefined
  /**
   * True when an API Gateway custom domain was created.
   */
  hasCustomDomain: boolean
}

/**
 * Node 24 Lambda + API Gateway HTTP API for packages/server.
 * No VPC / NAT — Neon and optional Upstash are reached over the public internet.
 *
 * @param inputs - Artifact path, runtime secrets/env, and optional API cert ARN.
 * @returns Lambda, HTTP API, and DNS target outputs.
 * @throws When the Lambda artifact directory is missing.
 */
export function createApi(inputs: ApiInputs): ApiOutputs {
  const artifactDir = resolveArtifactDir(inputs.serverArtifactPath)
  if (!existsSync(artifactDir)) {
    throw new Error(
      `Lambda artifact missing at ${artifactDir}. Pulumi builds it when limetry-oss:buildArtifacts is true.`,
    )
  }

  const assumeRole = aws.iam.getPolicyDocumentOutput({
    statements: [
      {
        actions: ["sts:AssumeRole"],
        principals: [
          {
            type: "Service",
            identifiers: ["lambda.amazonaws.com"],
          },
        ],
      },
    ],
  })

  const role = new aws.iam.Role(getName("api-role"), {
    name: getName("api-role"),
    assumeRolePolicy: assumeRole.json,
    tags: getTags("api"),
  })

  new aws.iam.RolePolicyAttachment(getName("api-basic"), {
    role: role.name,
    policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
  })

  new aws.iam.RolePolicy(getName("api-ssm-read"), {
    name: getName("api-ssm-read"),
    role: role.id,
    policy: pulumi.jsonStringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: [
            "ssm:GetParameter",
            "ssm:GetParameters",
            "ssm:GetParametersByPath",
          ],
          Resource: [
            `arn:aws:ssm:*:*:parameter${getSsmParameterPrefix()}/*`,
          ],
        },
      ],
    }),
  })

  const environment: Record<string, pulumi.Input<string>> = {
    NODE_ENV: "production",
    USE_POSTGRES_STORE: "true",
    DATABASE_URL: inputs.databaseUrl,
    JWT_SECRET: inputs.jwtSecret,
    LIMETRY_BEARER_TOKEN: inputs.bearerToken,
    DECISION_HMAC_SECRET: inputs.decisionHmacSecret,
    REPLAY_WINDOW_MS: inputs.replayWindowMs,
    THROTTLE_MAX_REQUESTS_PER_MINUTE: inputs.throttleMaxRequestsPerMinute,
    LIMETRY_DEFAULT_AUDIT_MODE: inputs.defaultAuditMode,
    LIMETRY_AUDIT_RETENTION_DAYS: inputs.auditRetentionDays,
    NEXT_PUBLIC_WEB_URL: `https://${inputs.webHostname}`,
    NEXT_PUBLIC_IS_CLOUD_ENABLED: inputs.isCloudEnabled,
    NEXT_PUBLIC_LAUNCHING_SOON: inputs.launchingSoon,
  }

  if (inputs.authSigningPrivateKeyHex !== undefined) {
    environment.AUTH_SIGNING_PRIVATE_KEY_HEX = inputs.authSigningPrivateKeyHex
  }

  if (inputs.redisUrl !== undefined) {
    environment.REDIS_URL = inputs.redisUrl
  }

  if (inputs.sentryDsn) {
    environment.SENTRY_DSN = inputs.sentryDsn
    environment.NEXT_PUBLIC_SENTRY_DSN = inputs.sentryDsn
  }

  if (inputs.posthogPublicProjectToken) {
    environment.POSTHOG_API_KEY = inputs.posthogPublicProjectToken
    environment.POSTHOG_KEY = inputs.posthogPublicProjectToken
    environment.NEXT_PUBLIC_POSTHOG_KEY = inputs.posthogPublicProjectToken
  }

  if (inputs.posthogHost) {
    environment.POSTHOG_HOST = inputs.posthogHost
    environment.NEXT_PUBLIC_POSTHOG_HOST = inputs.posthogHost
  }

  const functionName = getName("api")

  const logGroup = new aws.cloudwatch.LogGroup(getName("api-logs"), {
    name: `/aws/lambda/${functionName}`,
    retentionInDays: 14,
    tags: getTags("api"),
  })

  const lambda = new aws.lambda.Function(
    getName("api"),
    {
      name: functionName,
      runtime: aws.lambda.Runtime.NodeJS24dX,
      architectures: ["x86_64"],
      role: role.arn,
      handler: "lambda.handler",
      code: new pulumi.asset.FileArchive(artifactDir),
      memorySize: 512,
      timeout: 30,
      environment: {
        variables: environment,
      },
      tags: getTags("api"),
    },
    { dependsOn: [logGroup] },
  )

  const httpApi = new aws.apigatewayv2.Api(getName("http-api"), {
    protocolType: "HTTP",
    name: getName("http"),
    corsConfiguration: {
      allowHeaders: ["*"],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowOrigins: ["*"],
      maxAge: 86400,
    },
    tags: getTags("api"),
  })

  const integration = new aws.apigatewayv2.Integration(
    getName("lambda-integration"),
    {
      apiId: httpApi.id,
      integrationType: "AWS_PROXY",
      integrationUri: lambda.arn,
      payloadFormatVersion: "2.0",
      integrationMethod: "POST",
    },
  )

  new aws.apigatewayv2.Route(getName("proxy-route"), {
    apiId: httpApi.id,
    routeKey: "$default",
    target: pulumi.interpolate`integrations/${integration.id}`,
  })

  const stage = new aws.apigatewayv2.Stage(getName("default-stage"), {
    apiId: httpApi.id,
    name: "$default",
    autoDeploy: true,
    tags: getTags("api"),
  })

  new aws.lambda.Permission(getName("api-invoke"), {
    action: "lambda:InvokeFunction",
    function: lambda.name,
    principal: "apigateway.amazonaws.com",
    sourceArn: pulumi.interpolate`${httpApi.executionArn}/*/*`,
  })

  const invokeHost = pulumi.interpolate`${httpApi.id}.execute-api.${aws.getRegionOutput().name}.amazonaws.com`

  if (!inputs.apiCertificateArn) {
    return {
      lambdaArn: lambda.arn,
      lambdaFunctionName: lambda.name,
      logGroupName: logGroup.name,
      apiEndpoint: stage.invokeUrl,
      httpApiId: httpApi.id,
      invokeUrl: stage.invokeUrl,
      regionalDomainName: invokeHost,
      regionalHostedZoneId: undefined,
      hasCustomDomain: false,
    }
  }

  const domainName = new aws.apigatewayv2.DomainName(
    getName("api-domain"),
    {
      domainName: inputs.apiHostname,
      domainNameConfiguration: {
        certificateArn: inputs.apiCertificateArn,
        endpointType: "REGIONAL",
        securityPolicy: "TLS_1_2",
      },
      tags: getTags("api"),
    },
  )

  new aws.apigatewayv2.ApiMapping(getName("api-mapping"), {
    apiId: httpApi.id,
    domainName: domainName.id,
    stage: stage.name,
  })

  return {
    lambdaArn: lambda.arn,
    lambdaFunctionName: lambda.name,
    logGroupName: logGroup.name,
    apiEndpoint: pulumi.interpolate`https://${inputs.apiHostname}`,
    httpApiId: httpApi.id,
    invokeUrl: stage.invokeUrl,
    regionalDomainName: domainName.domainNameConfiguration.targetDomainName,
    regionalHostedZoneId: domainName.domainNameConfiguration.hostedZoneId,
    hasCustomDomain: true,
  }
}
