import * as azure from "@pulumi/azure-native"
import type { RegistryArgs } from "@pulumi/docker-build/types/input"
import * as k8s from "@pulumi/kubernetes"
import * as pulumi from "@pulumi/pulumi"

import type { CloudProviderConfig } from "../config"
import type { CloudProviderResources } from "./types"

/**
 * Creates an AKS/ACR adapter for the shared Kubernetes workload.
 *
 * @param name - Logical Limetry resource prefix.
 * @param config - Normalized cloud provider configuration.
 * @returns Azure Kubernetes and registry resources.
 */
export function createAzureProvider(
  name: string,
  config: CloudProviderConfig,
): CloudProviderResources {
  /** Resource group created for managed Azure deployments. */
  const resourceGroup = config.createCluster
    ? new azure.resources.ResourceGroup(`${name}-resource-group`, {
      location: config.location,
    })
    : undefined

  /** ACR registry created for managed Azure deployments. */
  const registry = config.createRegistry
    ? new azure.containerregistry.Registry(`${name}-registry`, {
      adminUserEnabled: true,
      location: config.location,
      resourceGroupName: resourceGroup?.name ?? requireResourceGroup(config),
      sku: { name: "Basic" },
    })
    : undefined

  /** Image repository URL used by the shared workload. */
  const repository = registry
    ? pulumi.interpolate`${registry.loginServer}/${name}/api`
    : config.registryRepository
  if (!repository && config.createCluster) {
    throw new Error("Azure managed clusters require createRegistry=true or registryRepository")
  }

  /** AKS cluster created when managed-cluster mode is enabled. */
  const cluster = config.createCluster
    ? new azure.containerservice.ManagedCluster(`${name}-cluster`, {
      agentPoolProfiles: [{
        count: config.nodeCount,
        mode: "System",
        name: "system",
        osType: "Linux",
        vmSize: config.nodeMachineType,
      }],
      dnsPrefix: config.clusterName,
      enableRBAC: true,
      identity: { type: "SystemAssigned" },
      kubernetesVersion: "1.31",
      location: config.location,
      resourceGroupName: resourceGroup?.name ?? requireResourceGroup(config),
    })
    : undefined
  /** Kubeconfig supplied by AKS or the externally managed cluster. */
  const kubeconfig = cluster
    ? buildAksKubeconfig(cluster, resourceGroup?.name ?? requireResourceGroup(config))
    : requireKubeconfig(config)
  /** Kubernetes provider connected to the selected AKS or external cluster. */
  const kubernetesProvider = new k8s.Provider(`${name}-kubernetes`, { kubeconfig })

  /** ACR credentials used by the image builder. */
  const credentials = registry
    ? azure.containerregistry.listRegistryCredentialsOutput({
      registryName: registry.name,
      resourceGroupName: resourceGroup?.name ?? requireResourceGroup(config),
    })
    : undefined
  /** Docker registry credentials passed to the image builder. */
  const registries: pulumi.Input<RegistryArgs[]> | undefined = registry && credentials
    ? [{
      address: registry.loginServer,
      password: pulumi.secret(credentials.apply((value) => value.passwords?.[0]?.value ?? "")),
      username: credentials.apply((value) => value.username),
    }]
    : undefined

  return {
    cloudProvider: "azure",
    imageRepository: repository ?? `${name}-server`,
    kubernetesProvider,
    registries,
  }
}

function buildAksKubeconfig(
  cluster: azure.containerservice.ManagedCluster,
  resourceGroupName: pulumi.Input<string>,
): pulumi.Output<string> {
  return azure.containerservice
    .listManagedClusterUserCredentialsOutput({
      resourceGroupName,
      resourceName: cluster.name,
    })
    .apply((credentials) => {
      const value = credentials.kubeconfigs?.[0]?.value
      if (!value) {
        throw new Error("AKS did not return a user kubeconfig")
      }
      return Buffer.from(value, "base64").toString("utf8")
    })
}

function requireResourceGroup(config: CloudProviderConfig): pulumi.Input<string> {
  const resourceGroup = config.resourceGroupName ?? process.env.AZURE_RESOURCE_GROUP?.trim()
  if (!resourceGroup) {
    throw new Error(
      "Azure requires createCluster=true or AZURE_RESOURCE_GROUP when using an external cluster",
    )
  }
  return resourceGroup
}

function requireKubeconfig(config: CloudProviderConfig): pulumi.Input<string> | undefined {
  return config.kubeconfig ? pulumi.secret(config.kubeconfig) : undefined
}
