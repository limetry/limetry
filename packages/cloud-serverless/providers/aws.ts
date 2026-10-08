import { execFileSync } from "node:child_process"
import { existsSync } from "node:fs"
import { join } from "node:path"

import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi"

import { createNeonDatabase } from "./neon"
import type {
  ServerlessDnsRecord,
  ServerlessProviderArgs,
  ServerlessProviderResources,
} from "./types"

/**
 * Creates an AWS Lambda and API Gateway HTTP API deployment.
 *
 * SQLite is stored in Lambda's ephemeral `/tmp` directory by default. The
 * managed database option creates Aurora Serverless v2 and places Lambda in
 * the same default VPC so the PostgreSQL connection remains private.
 *
 * @param args - Shared serverless deployment inputs.
 * @returns AWS serverless resources and the public API URL.
 */
export function createAwsProvider(args: ServerlessProviderArgs): ServerlessProviderResources {
  /** Lambda bundle path, generated automatically when a direct Pulumi deploy needs it. */
  const lambdaBundle = ensureLambdaBundle(args.repoRoot)

  /** IAM role assumed by the Lambda function. */
  const lambdaRole = new aws.iam.Role(`${args.name}-lambda-role`, {
    assumeRolePolicy: aws.iam.getPolicyDocumentOutput({
      statements: [{
        actions: ["sts:AssumeRole"],
        effect: "Allow",
        principals: [{ identifiers: ["lambda.amazonaws.com"], type: "Service" }],
      }],
    }).json,
  })

  /** Basic Lambda logging permissions. */
  const basicExecutionPolicy = new aws.iam.RolePolicyAttachment(`${args.name}-lambda-basic-policy`, {
    policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
    role: lambdaRole.name,
  })

  /** VPC networking permissions used only when Aurora is enabled. */
  const vpcExecutionPolicy = args.config.databaseProvider === "rds"
    ? new aws.iam.RolePolicyAttachment(`${args.name}-lambda-vpc-policy`, {
      policyArn: aws.iam.ManagedPolicy.AWSLambdaVPCAccessExecutionRole,
      role: lambdaRole.name,
    })
    : undefined

  /** Optional Aurora Serverless v2 database connection details. */
  const rdsDatabase = args.config.databaseProvider === "rds"
    ? createAwsDatabase(args)
    : undefined
  const neonDatabase = args.config.databaseProvider === "neon"
    ? createNeonDatabase(args)
    : undefined
  const database = rdsDatabase ?? neonDatabase

  /** Lambda environment including the selected persistence configuration. */
  const environment = database
    ? {
      ...args.environment,
      DATABASE_URL: database.connectionString,
      USE_POSTGRES_STORE: "true",
    }
    : args.environment

  /** Lambda function running the Limetry server bundle. */
  const lambda = new aws.lambda.Function(`${args.name}-api`, {
    architectures: ["x86_64"],
    code: new pulumi.asset.FileArchive(lambdaBundle),
    environment: { variables: environment },
    handler: "lambda.handler",
    memorySize: args.config.memoryMb,
    role: lambdaRole.arn,
    runtime: "nodejs22.x",
    timeout: args.config.timeoutSeconds,
    vpcConfig: rdsDatabase
      ? {
        securityGroupIds: [rdsDatabase.lambdaSecurityGroup.id],
        subnetIds: rdsDatabase.subnetIds,
      }
      : undefined,
  }, {
    dependsOn: [basicExecutionPolicy, ...(vpcExecutionPolicy ? [vpcExecutionPolicy] : [])],
  })

  /** Public API Gateway HTTP API. */
  const api = new aws.apigatewayv2.Api(`${args.name}-api`, {
    protocolType: "HTTP",
  })

  /** API Gateway integration forwarding requests to Lambda. */
  const integration = new aws.apigatewayv2.Integration(`${args.name}-integration`, {
    apiId: api.id,
    integrationType: "AWS_PROXY",
    integrationUri: lambda.invokeArn,
    payloadFormatVersion: "2.0",
  })

  /** Default route forwarding every API path to the Lambda integration. */
  const _route = new aws.apigatewayv2.Route(`${args.name}-route`, {
    apiId: api.id,
    routeKey: "$default",
    target: pulumi.interpolate`integrations/${integration.id}`,
  })

  /** Auto-deployed API Gateway stage. */
  const _stage = new aws.apigatewayv2.Stage(`${args.name}-stage`, {
    apiId: api.id,
    autoDeploy: true,
    name: "$default",
  })

  /** Permission allowing API Gateway to invoke Lambda. */
  const _permission = new aws.lambda.Permission(`${args.name}-invoke-permission`, {
    action: "lambda:InvokeFunction",
    function: lambda.name,
    principal: "apigateway.amazonaws.com",
    sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
  })

  const certificate = args.config.apiDomain
    ? new aws.acm.Certificate(`${args.name}-certificate`, {
      domainName: args.config.apiDomain,
      validationMethod: "DNS",
    })
    : undefined
  const validationRecordNames = certificate && args.createDnsRecords
    ? args.createDnsRecords("validation", certificate.domainValidationOptions.apply((options) =>
      options.map<ServerlessDnsRecord>((option) => ({
        content: option.resourceRecordValue,
        name: option.resourceRecordName,
        type: "CNAME",
      })),
    ))
    : undefined
  const certificateValidation = certificate && validationRecordNames
    ? new aws.acm.CertificateValidation(`${args.name}-certificate-validation`, {
      certificateArn: certificate.arn,
      validationRecordFqdns: validationRecordNames,
    })
    : undefined
  const customDomain = certificate && args.config.apiDomain
    ? new aws.apigatewayv2.DomainName(`${args.name}-domain`, {
      domainName: args.config.apiDomain,
      domainNameConfiguration: {
        certificateArn: certificateValidation?.certificateArn ?? certificate.arn,
        endpointType: "REGIONAL",
        securityPolicy: "TLS_1_2",
      },
    }, certificateValidation ? { dependsOn: [certificateValidation] } : undefined)
    : undefined
  const _mapping = customDomain
    ? new aws.apigatewayv2.ApiMapping(`${args.name}-mapping`, {
      apiId: api.id,
      domainName: customDomain.id,
      stage: "$default",
    }, { dependsOn: [_stage] })
    : undefined
  if (customDomain && args.createDnsRecords && args.config.apiDomain) {
    args.createDnsRecords("traffic", [{
      content: customDomain.domainNameConfiguration.targetDomainName,
      name: args.config.apiDomain,
      type: "CNAME",
    }])
  }

  return {
    apiImageReference: "lambda-bundle",
    apiUrl: args.config.apiDomain
      ? pulumi.interpolate`https://${args.config.apiDomain}`
      : api.apiEndpoint,
    managedDatabaseConnection: rdsDatabase?.connectionString ?? neonDatabase?.connectionString,
  }
}

/**
 * Builds the Lambda bundle when it is not already present.
 *
 * Pulumi evaluates the program before registering the Lambda resource, so a
 * direct `pulumi up` must prepare the archive before `FileArchive` hashes it.
 *
 * @param repoRoot - Repository root containing the server bundle script.
 * @returns Existing or newly generated Lambda bundle directory.
 */
function ensureLambdaBundle(repoRoot: string): string {
  const bundlePath = join(repoRoot, "packages/server/lambda-bundle")
  const bundleEntryPoint = join(bundlePath, "lambda.js")
  if (!existsSync(bundleEntryPoint)) {
    execFileSync(
      process.execPath,
      [join(repoRoot, "packages/server/scripts/build-lambda-bundle.mjs")],
      { cwd: repoRoot, stdio: "inherit" },
    )
  }
  if (!existsSync(bundleEntryPoint)) {
    throw new Error(`Lambda bundle was not created at ${bundleEntryPoint}`)
  }
  return bundlePath
}

/**
 * Creates a low-capacity Aurora Serverless v2 database in the default VPC.
 *
 * @param args - Shared serverless deployment inputs.
 * @returns Aurora connection details and Lambda VPC settings.
 */
function createAwsDatabase(args: ServerlessProviderArgs): {
  connectionString: pulumi.Output<string>
  lambdaSecurityGroup: aws.ec2.SecurityGroup
  subnetIds: pulumi.Output<string[]>
} {
  /** Default VPC used to keep Lambda-to-Aurora traffic private. */
  const vpc = aws.ec2.getVpcOutput({ default: true })

  /** Default VPC subnets used by Lambda and Aurora. */
  const subnetIds = aws.ec2.getSubnetsOutput({
    filters: [{ name: "vpc-id", values: [vpc.id] }],
  }).ids

  /** Aurora subnet group spanning the default VPC subnets. */
  const subnetGroup = new aws.rds.SubnetGroup(`${args.name}-database-subnets`, {
    subnetIds,
  })

  /** Security group assigned to the Lambda ENIs. */
  const lambdaSecurityGroup = new aws.ec2.SecurityGroup(`${args.name}-lambda-sg`, {
    description: "Allow Limetry Lambda to reach Aurora",
    egress: [{ cidrBlocks: ["0.0.0.0/0"], fromPort: 0, protocol: "-1", toPort: 0 }],
    vpcId: vpc.id,
  })

  /** Security group allowing PostgreSQL traffic only from Lambda. */
  const databaseSecurityGroup = new aws.ec2.SecurityGroup(`${args.name}-database-sg`, {
    description: "Allow Limetry Lambda to reach Aurora",
    egress: [{ cidrBlocks: ["0.0.0.0/0"], fromPort: 0, protocol: "-1", toPort: 0 }],
    ingress: [{
      fromPort: 5432,
      protocol: "tcp",
      securityGroups: [lambdaSecurityGroup.id],
      toPort: 5432,
    }],
    vpcId: vpc.id,
  })

  /** Database password kept encrypted in Pulumi state. */
  const password = args.secrets.databasePassword

  /** Aurora Serverless v2 cluster. */
  const cluster = new aws.rds.Cluster(`${args.name}-database`, {
    databaseName: args.config.databaseName,
    dbSubnetGroupName: subnetGroup.name,
    engine: "aurora-postgresql",
    engineMode: "provisioned",
    masterPassword: password,
    masterUsername: args.config.databaseUsername,
    skipFinalSnapshot: true,
    serverlessv2ScalingConfiguration: {
      maxCapacity: 1,
      minCapacity: 0.5,
    },
    vpcSecurityGroupIds: [databaseSecurityGroup.id],
  })

  /** Aurora Serverless v2 compute instance. */
  const _instance = new aws.rds.ClusterInstance(`${args.name}-database-instance`, {
    clusterIdentifier: cluster.id,
    engine: "aurora-postgresql",
    instanceClass: "db.serverless",
  })

  /** PostgreSQL connection string used by Lambda. */
  const connectionString = pulumi.secret(pulumi.interpolate`postgresql://${args.config.databaseUsername}:${password}@${cluster.endpoint}:5432/${args.config.databaseName}`)

  return {
    connectionString,
    lambdaSecurityGroup,
    subnetIds,
  }
}
