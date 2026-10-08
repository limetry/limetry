import * as aws from "@pulumi/aws"
import type { RegistryArgs } from "@pulumi/docker-build/types/input"
import * as eks from "@pulumi/eks"
import * as k8s from "@pulumi/kubernetes"
import * as pulumi from "@pulumi/pulumi"
import * as random from "@pulumi/random"

import type { CloudProviderConfig } from "../config"
import type { CloudProviderResources } from "./types"

/**
 * Creates an AWS EKS/ECR adapter for the shared Kubernetes workload.
 *
 * @param name - Logical Limetry resource prefix.
 * @param config - Normalized cloud provider configuration.
 * @returns AWS Kubernetes and registry resources.
 */
export function createAwsProvider(
  name: string,
  config: CloudProviderConfig,
): CloudProviderResources {
  /** ECR repository created for managed AWS deployments. */
  const repository = config.createRegistry
    ? new aws.ecr.Repository(`${name}-registry`, {
      forceDelete: config.createCluster,
      imageScanningConfiguration: { scanOnPush: true },
    })
    : undefined
  /** Image repository URL used by the shared workload. */
  const repositoryUrl = repository?.repositoryUrl ?? config.registryRepository ?? `${name}-server`
  if (config.createCluster && !repository) {
    throw new Error("AWS managed clusters require createRegistry=true or registryRepository")
  }

  /** EKS cluster created when managed-cluster mode is enabled. */
  const cluster = config.createCluster
    ? new eks.Cluster(`${name}-cluster`, {
      desiredCapacity: config.nodeCount,
      instanceType: config.nodeMachineType,
      minSize: config.nodeCount,
      maxSize: Math.max(config.nodeCount, config.nodeCount * 2),
      version: "1.31",
    })
    : undefined
  /** Kubeconfig supplied by EKS or the externally managed cluster. */
  const kubeconfig = cluster?.kubeconfigJson ?? requireKubeconfig(config)

  /** Kubernetes provider connected to the selected EKS or external cluster. */
  const kubernetesProvider = new k8s.Provider(`${name}-kubernetes`, { kubeconfig })

  /** ECR authorization token used by the image builder. */
  const authToken = repository
    ? aws.ecr.getAuthorizationTokenOutput({ registryId: repository.registryId })
    : undefined
  /** Docker registry credentials passed to the image builder. */
  const registries: pulumi.Input<RegistryArgs[]> | undefined = repository && authToken
    ? [{
      address: repository.repositoryUrl,
      password: pulumi.secret(authToken.password),
      username: authToken.userName,
    }]
    : undefined
  const database = config.databaseProvider === "rds"
    ? createRdsDatabase(name, config)
    : undefined

  return {
    cloudProvider: "aws",
    databaseUrl: database?.connectionString,
    imageRepository: repositoryUrl,
    kubernetesProvider,
    registries,
  }
}

/**
 * Creates a low-capacity RDS PostgreSQL instance in the default VPC.
 *
 * @param name - Logical Limetry resource prefix.
 * @param config - Normalized cloud deployment configuration.
 * @returns RDS connection details.
 */
function createRdsDatabase(
  name: string,
  config: CloudProviderConfig,
): {
  connectionString: pulumi.Output<string>
} {
  const vpc = aws.ec2.getVpcOutput({ default: true })
  const subnetIds = aws.ec2.getSubnetsOutput({
    filters: [{ name: "vpc-id", values: [vpc.id] }],
  }).ids
  const subnetGroup = new aws.rds.SubnetGroup(`${name}-database-subnets`, { subnetIds })
  const securityGroup = new aws.ec2.SecurityGroup(`${name}-database-sg`, {
    description: "Allow Limetry Kubernetes workloads to reach RDS PostgreSQL",
    egress: [{ cidrBlocks: ["0.0.0.0/0"], fromPort: 0, protocol: "-1", toPort: 0 }],
    ingress: [{
      cidrBlocks: [config.databaseAllowedCidr],
      fromPort: 5432,
      protocol: "tcp",
      toPort: 5432,
    }],
    vpcId: vpc.id,
  })
  const password = new random.RandomPassword(`${name}-database-password`, {
    length: 40,
    special: false,
  })
  const instance = new aws.rds.Instance(`${name}-database`, {
    allocatedStorage: 20,
    dbName: config.databaseName,
    dbSubnetGroupName: subnetGroup.name,
    engine: "postgres",
    engineVersion: "16",
    instanceClass: "db.t4g.micro",
    password: password.result,
    publiclyAccessible: false,
    skipFinalSnapshot: true,
    storageType: "gp3",
    username: config.databaseUsername,
    vpcSecurityGroupIds: [securityGroup.id],
  })

  return {
    connectionString: pulumi.secret(pulumi.interpolate`postgresql://${config.databaseUsername}:${password.result}@${instance.address}:${instance.port}/${config.databaseName}?sslmode=require`),
  }
}

function requireKubeconfig(config: CloudProviderConfig): pulumi.Input<string> | undefined {
  return config.kubeconfig ? pulumi.secret(config.kubeconfig) : undefined
}
