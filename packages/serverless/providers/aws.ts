import type { ProviderArgs, ProviderResources } from "./types"

/**
 * Creates an SST Lambda and API Gateway HTTP API deployment.
 *
 * @param args - Shared deployment inputs.
 * @returns AWS resources and their public URL.
 */
export async function createAwsProvider(args: ProviderArgs): Promise<ProviderResources> {
  const rdsDatabase = args.config.databaseProvider === "rds" ? createDatabase(args) : undefined
  const neonDatabase = args.config.databaseProvider === "neon"
    ? (await import("./neon.js")).createNeonDatabase(args)
    : undefined
  const database = rdsDatabase ?? neonDatabase
  const environment = database
    ? {
      ...args.environment,
      DATABASE_URL: database.connectionString,
      USE_POSTGRES_STORE: "true",
    }
    : args.environment
  const domain = args.config.apiDomain && args.config.apiCertificateId
    ? {
      cert: args.config.apiCertificateId,
      dns: false as const,
      name: args.config.apiDomain,
    }
    : args.config.apiDomain && args.config.apiDomainZone
      ? {
        dns: sst.aws.dns({ zone: args.config.apiDomainZone }),
        name: args.config.apiDomain,
      }
      : undefined
  const functionArgs = {
    bundle: `${args.repoRoot}/packages/server/lambda-bundle`,
    environment,
    handler: "lambda.handler",
    memory: `${args.config.memoryMb} MB` as `${number} MB`,
    runtime: "nodejs22.x" as const,
    timeout: `${args.config.timeoutSeconds} seconds` as `${number} seconds`,
    vpc: rdsDatabase
      ? {
        securityGroups: [rdsDatabase.lambdaSecurityGroup.id],
        privateSubnets: rdsDatabase.subnetIds,
      }
      : undefined,
  }

  /** Lambda function running the Limetry server bundle. */
  const lambda = new sst.aws.Function(`${args.name}-api`, functionArgs)

  /** API Gateway HTTP API forwarding all routes to the Lambda function. */
  const api = new sst.aws.ApiGatewayV2(`${args.name}-gateway`, {
    accessLog: { retention: "1 month" },
    cors: true,
    domain,
  })
  api.route("$default", lambda.arn)

  return {
    apiImageReference: lambda.name,
    apiUrl: api.url,
    managedDatabaseConnection: rdsDatabase?.connectionString ?? neonDatabase?.connectionString,
    managedDatabaseHost: neonDatabase?.host,
    provider: "aws",
  }
}

/**
 * Creates the low-capacity Aurora Serverless v2 database and Lambda VPC wiring.
 *
 * @param args - Shared deployment inputs.
 * @returns Aurora connection details and Lambda networking values.
 */
function createDatabase(args: ProviderArgs): {
  connectionString: $util.Output<string>
  lambdaSecurityGroup: aws.ec2.SecurityGroup
  subnetIds: $util.Output<string[]>
} {
  /** Default VPC used for private Lambda-to-Aurora connectivity. */
  const vpc = aws.ec2.getVpcOutput({ default: true })

  /** Default VPC subnets used by the Lambda and Aurora resources. */
  const subnetIds = aws.ec2.getSubnetsOutput({
    filters: [{ name: "vpc-id", values: [vpc.id] }],
  }).ids

  /** Aurora subnet group spanning the default VPC subnets. */
  const subnetGroup = new aws.rds.SubnetGroup(`${args.name}-database-subnets`, {
    subnetIds,
  })

  /** Security group assigned to Lambda elastic network interfaces. */
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

  /** Aurora Serverless v2 cluster. */
  const cluster = new aws.rds.Cluster(`${args.name}-database`, {
    databaseName: args.config.databaseName,
    dbSubnetGroupName: subnetGroup.name,
    engine: "aurora-postgresql",
    engineMode: "provisioned",
    masterPassword: args.secrets.databasePassword,
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

  /** PostgreSQL connection string consumed by the Lambda runtime. */
  const connectionString = $util.secret($util.all([
    cluster.endpoint,
    _instance.id,
    args.secrets.databasePassword,
  ]).apply(([endpoint, instanceId, password]) => {
    if (!instanceId) {
      throw new Error("Aurora instance was not created")
    }
    return `postgresql://${args.config.databaseUsername}:${password}@${endpoint}:5432/${args.config.databaseName}`
  }))

  return {
    connectionString,
    lambdaSecurityGroup,
    subnetIds,
  }
}
