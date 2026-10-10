# Limetry cloud-agnostic self-host stack

This Pulumi program deploys the OSS evaluate API to a Kubernetes cluster. It
intentionally does not deploy `packages/web`; the website remains an example
deployment in `packages/infra`.

One shared workload supports three managed providers:

- AWS EKS with ECR
- Google Kubernetes Engine with Artifact Registry
- Azure Kubernetes Service with Azure Container Registry

Set `cloudProvider` to exactly one provider per Pulumi stack. The provider
adapter creates a cluster and registry when requested, then passes the
resulting Kubernetes provider and image repository to the common workload.
An existing cluster can be used instead by leaving `createCluster=false` and
supplying `kubeconfig` as an encrypted Pulumi secret. If no secret is supplied,
the Kubernetes provider uses the normal local kubeconfig environment.

## Default Neon deployment

The default is two API replicas backed by Neon Serverless Postgres:

```sh
cd packages/cloud
pulumi stack init dev
pulumi up
```

The checked-in `Pulumi.dev.yaml` is configured for an existing AWS-compatible
Kubernetes context and local image loading. It does not create a cluster or
registry. Confirm that the current kubeconfig context points at the intended
cluster before running `pulumi up`.

Pulumi generates `bearerToken`, `jwtSecret`, and `decisionHmacSecret` when they
are not configured. The generated values are kept in encrypted Pulumi state by
stable password resources and are passed to the API through a Kubernetes Secret.
Explicit values can be supplied as encrypted Pulumi config:

```sh
pulumi config set --secret bearerToken "replace-with-a-long-token"
pulumi config set --secret jwtSecret "replace-with-a-long-secret"
pulumi config set --secret decisionHmacSecret "replace-with-a-long-secret"
```

Neon is provisioned outside the selected Kubernetes provider and uses a pooled
connection. Set `databaseProvider=sqlite` for a one-replica persistent-volume
deployment.

## Database providers

Neon is the default. Configure its project and region, and provide either
`NEON_API_KEY` or an encrypted `neonApiKey`:

```sh
pulumi config set databaseProvider neon
pulumi config set neonProjectName example-project
pulumi config set neonRegion aws-us-east-1
pulumi config set --secret neonApiKey "replace-with-a-neon-api-key"
pulumi config set replicas 2
```

On AWS, select RDS instead:

```sh
pulumi config set databaseProvider rds
pulumi config set databaseAllowedCidr 10.0.0.0/8
pulumi up
```

RDS is private and only available with `cloudProvider=aws`. Neon and RDS add
ongoing database charges; review provider pricing before deployment.

## Cloud provider configuration

The provider SDK must be authenticated before previewing or deploying:

### AWS

```sh
aws sso login
pulumi config set cloudProvider aws
pulumi config set location us-west-2
```

The profile needs permissions for EKS, ECR, IAM, EC2 networking, and the
Kubernetes resources created by the resulting cluster. Set
`createCluster=true` and `createRegistry=true` to let this stack create EKS and
ECR resources. Managed EKS creates billable control-plane and worker resources.

### Google Cloud

```sh
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
pulumi config set cloudProvider gcp
pulumi config set location us-central1
```

The identity needs permission to create GKE clusters and Artifact Registry
repositories, plus the required service-account and network permissions.
Managed GKE worker nodes and supporting resources are billable.

### Azure

```sh
az login
pulumi config set cloudProvider azure
pulumi config set location westus2
```

The identity needs permission to create resource groups, AKS clusters, and ACR
registries. Managed AKS worker nodes, control-plane features, and registry
storage are billable.

To use an existing Azure resource group while creating or using an external
cluster, set `resourceGroupName`. The environment variable
`AZURE_RESOURCE_GROUP` is accepted as a fallback.

Use `pulumi config set --secret kubeconfig "$(cat ~/.kube/config)"` when the
cluster should use a specific kubeconfig rather than the local default.

## API image and public access

The deployment requires Docker or another compatible local image builder. By
default, the image is tagged `limetry-server:pulumi-<stack>` and loaded into
the local Docker environment. This is suitable for local clusters. Managed
clusters require a registry. Set `createRegistry=true` to create the selected
provider's registry, or set `registryRepository` to an existing repository:

```sh
pulumi config set createRegistry true
pulumi config set registryRepository REGISTRY_REPOSITORY
pulumi config set apiImageTag dev
pulumi up
```

`apiImageRepository` remains accepted as a compatibility alias for
`registryRepository`. Registry credentials are obtained from the selected
cloud provider when this stack creates the registry. For an existing private
registry, configure Docker credentials in the deployment environment.

The API Service defaults to `LoadBalancer`. If `apiDomain` is configured, the
stack adds ExternalDNS annotations and uses `https://<apiDomain>` in its URL
outputs. Set `apiDomainZone` to the authoritative DNS zone for your domain:

```sh
pulumi config set apiDomain api.example.com
pulumi config set apiDomainZone example.com
pulumi up
```

The cluster must have a LoadBalancer implementation for public access and an
ExternalDNS installation for automatic DNS records. Without `apiDomain`, the
stack exports the provider-assigned HTTP load-balancer URL once Kubernetes
assigns an address. This fallback is not TLS-enabled.

## Costs and teardown

SQLite requires a durable-volume provisioner and is deliberately limited to
one API replica. Neon and RDS support horizontal scaling, but add ongoing
database charges.

Managed Kubernetes is not free. Review the provider's current pricing for
control planes, worker nodes, load balancers, disks, registries, and network
egress before enabling cluster or registry creation. Pulumi only reports
resource state; it does not provide a complete cloud billing estimate.

Destroy all resources created by this stack when they are no longer needed:

```sh
pulumi destroy
pulumi stack rm dev
```

Do not run `pulumi stack rm` until `pulumi destroy` completes. External
clusters and registries are not owned by this stack and are not deleted.

## Outputs and API documentation

The stack exports the API origin, service address, image reference, persistence
mode, and documentation URLs. Secret outputs remain hidden by Pulumi unless
`pulumi stack output --show-secrets` is explicitly used.

Versioned documentation routes are:

- `https://<api-domain>/v1/openapi.json`
- `https://<api-domain>/v1/openapi.yaml`
- `https://<api-domain>/v1/docs`

The unversioned `/openapi`, `/openapi.json`, and `/openapi.yaml` routes remain
available for compatibility.
