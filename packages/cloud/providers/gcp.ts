import type { RegistryArgs } from "@pulumi/docker-build/types/input"
import * as gcp from "@pulumi/gcp"
import * as k8s from "@pulumi/kubernetes"
import * as pulumi from "@pulumi/pulumi"

import type { CloudProviderConfig } from "../config"
import type { CloudProviderResources } from "./types"

/**
 * Creates a GKE/Artifact Registry adapter for the shared Kubernetes workload.
 *
 * @param name - Logical Limetry resource prefix.
 * @param config - Normalized cloud provider configuration.
 * @returns GCP Kubernetes and registry resources.
 */
export function createGcpProvider(
  name: string,
  config: CloudProviderConfig,
): CloudProviderResources {
  /** GCP client configuration used for project and registry authentication. */
  const clientConfig = gcp.organizations.getClientConfigOutput()

  /** Project used for GKE and Artifact Registry resources. */
  const project = gcp.config.project ?? clientConfig.project

  /** Artifact Registry repository identifier. */
  const repositoryName = config.registryRepository?.split("/").at(-1) ?? `${name}-registry`

  /** Artifact Registry repository created for managed GCP deployments. */
  const repository = config.createRegistry
    ? new gcp.artifactregistry.Repository(`${name}-registry`, {
      description: "Limetry API container images",
      format: "DOCKER",
      location: config.location,
      repositoryId: repositoryName,
    })
    : undefined

  /** Provider-qualified image repository path. */
  const repositoryPath = repository
    ? pulumi.interpolate`${project}/${config.location}/${repository.repositoryId}`
    : config.registryRepository
  if (!repositoryPath && config.createCluster) {
    throw new Error("GCP managed clusters require createRegistry=true or registryRepository")
  }

  /** GKE cluster created when managed-cluster mode is enabled. */
  const cluster = config.createCluster
    ? new gcp.container.Cluster(`${name}-cluster`, {
      initialNodeCount: config.nodeCount,
      location: config.location,
      name: config.clusterName,
      nodeConfig: {
        machineType: config.nodeMachineType,
        oauthScopes: ["https://www.googleapis.com/auth/cloud-platform"],
      },
      removeDefaultNodePool: false,
    })
    : undefined
  /** Kubeconfig supplied by GKE or the externally managed cluster. */
  const kubeconfig = cluster
    ? buildGkeKubeconfig(cluster, clientConfig.accessToken)
    : requireKubeconfig(config)
  /** Kubernetes provider connected to the selected GKE or external cluster. */
  const kubernetesProvider = new k8s.Provider(`${name}-kubernetes`, { kubeconfig })

  /** Artifact Registry hostname for the selected location. */
  const registryAddress = `${config.location}-docker.pkg.dev`

  /** Docker registry credentials passed to the image builder. */
  const registries: pulumi.Input<RegistryArgs[]> | undefined = repository
    ? [{
      address: registryAddress,
      password: pulumi.secret(clientConfig.accessToken),
      username: "oauth2accesstoken",
    }]
    : undefined

  return {
    cloudProvider: "gcp",
    imageRepository: repository
      ? pulumi.interpolate`${registryAddress}/${repositoryPath}`
      : config.registryRepository ?? `${name}-server`,
    kubernetesProvider,
    registries,
  }
}

function buildGkeKubeconfig(
  cluster: gcp.container.Cluster,
  accessToken: pulumi.Output<string>,
): pulumi.Output<string> {
  return pulumi
    .all([cluster.endpoint, cluster.masterAuth, accessToken])
    .apply(([endpoint, masterAuth, token]) => {
      const certificate = masterAuth?.clusterCaCertificate
      if (!certificate) {
        throw new Error("GKE did not return a cluster CA certificate")
      }
      return JSON.stringify({
        apiVersion: 1,
        clusters: [{
          cluster: {
            "certificate-authority-data": certificate,
            server: `https://${endpoint}`,
          },
          name: "gke",
        }],
        contexts: [{ context: { cluster: "gke", user: "gke" }, name: "gke" }],
        "current-context": "gke",
        kind: "Config",
        users: [{ name: "gke", user: { token } }],
      })
    })
}

function requireKubeconfig(config: CloudProviderConfig): pulumi.Input<string> | undefined {
  return config.kubeconfig ? pulumi.secret(config.kubeconfig) : undefined
}
