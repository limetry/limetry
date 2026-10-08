import * as aws from "@pulumi/aws"
import type { RegistryArgs } from "@pulumi/docker-build/types/input"
import * as eks from "@pulumi/eks"
import * as k8s from "@pulumi/kubernetes"
import * as pulumi from "@pulumi/pulumi"

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
  const repository = config.createRegistry
    ? new aws.ecr.Repository(`${name}-registry`, {
      forceDelete: config.createCluster,
      imageScanningConfiguration: { scanOnPush: true },
    })
    : undefined
  const repositoryUrl = repository?.repositoryUrl ?? config.registryRepository ?? `${name}-server`
  if (config.createCluster && !repository) {
    throw new Error("AWS managed clusters require createRegistry=true or registryRepository")
  }

  const cluster = config.createCluster
    ? new eks.Cluster(`${name}-cluster`, {
      desiredCapacity: config.nodeCount,
      instanceType: config.nodeMachineType,
      minSize: config.nodeCount,
      maxSize: Math.max(config.nodeCount, config.nodeCount * 2),
      version: "1.31",
    })
    : undefined
  const kubeconfig = cluster?.kubeconfigJson ?? requireKubeconfig(config)
  const kubernetesProvider = new k8s.Provider(`${name}-kubernetes`, { kubeconfig })

  const authToken = repository
    ? aws.ecr.getAuthorizationTokenOutput({ registryId: repository.registryId })
    : undefined
  const registries: pulumi.Input<RegistryArgs[]> | undefined = repository && authToken
    ? [{
      address: repository.repositoryUrl,
      password: pulumi.secret(authToken.password),
      username: authToken.userName,
    }]
    : undefined

  return {
    cloudProvider: "aws",
    imageRepository: repositoryUrl,
    kubernetesProvider,
    registries,
  }
}

function requireKubeconfig(config: CloudProviderConfig): pulumi.Input<string> | undefined {
  return config.kubeconfig ? pulumi.secret(config.kubeconfig) : undefined
}
