import type { RegistryArgs } from "@pulumi/docker-build/types/input"
import type * as k8s from "@pulumi/kubernetes"
import type * as pulumi from "@pulumi/pulumi"

import type { CloudProviderConfig } from "../config"

/** Resources and connection details supplied to the shared workload stack. */
export type CloudProviderResources = {
  cloudProvider: CloudProviderConfig["cloudProvider"]
  databaseUrl?: pulumi.Output<string>
  imageRepository: pulumi.Input<string>
  kubernetesProvider: k8s.Provider
  registries?: pulumi.Input<RegistryArgs[]>
}

/** Factory for a cloud-specific Kubernetes and registry adapter. */
export type CloudProviderFactory = (
  name: string,
  config: CloudProviderConfig,
) => CloudProviderResources
