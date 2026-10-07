# Limetry cloud-agnostic self-host stack

This Pulumi program deploys the OSS evaluate API to any Kubernetes-compatible
cluster. It intentionally does not deploy `packages/web`; the website remains
an example deployment in `packages/infra`.

The same stack supports local Kubernetes, managed Kubernetes, and private-cloud
clusters. The API image is built from the current repository during deployment,
so there is no required image URL or manually maintained port setting.

## Zero-configuration SQLite deployment

The default is one API replica backed by SQLite on a persistent volume:

```sh
cd packages/cloud
pulumi stack init dev
pulumi up
```

Pulumi generates `bearerToken`, `jwtSecret`, and `decisionHmacSecret` when they
are not configured. The generated values are kept in encrypted Pulumi state by
stable password resources and are passed to the API through a Kubernetes Secret.
Explicit values can be supplied as encrypted Pulumi config:

```sh
pulumi config set --secret bearerToken "replace-with-a-long-token"
pulumi config set --secret jwtSecret "replace-with-a-long-secret"
pulumi config set --secret decisionHmacSecret "replace-with-a-long-secret"
```

SQLite is the affordable, provider-neutral default, but it is deliberately
limited to one API replica and requires a persistent-volume provisioner. It is
well suited to local development and small self-hosted deployments. Use
Postgres before scaling the API horizontally or when the platform does not
provide durable volumes.

## Postgres mode

Set `usePostgres=true` and provide a reachable encrypted `databaseUrl`:

```sh
pulumi config set usePostgres true
pulumi config set replicas 2
pulumi config set --secret databaseUrl "postgresql://limetry:password@postgres.example/limetry"
pulumi up
```

`postgresPassword` is required only when the optional in-cluster development
Postgres resource is used. A managed Postgres service is recommended for
production. The default in-cluster image and storage settings can be changed
with `postgresImage` and `postgresStorageSize`.

## API image and public access

The deployment requires Docker or another compatible local image builder. By
default, the image is tagged `limetry-server:pulumi-<stack>` and loaded into
the local Docker environment. Set `apiImageRepository` when the target cluster
pulls from a registry:

```sh
pulumi config set apiImageRepository ghcr.io/example/limetry-server
pulumi config set apiImageTag dev
pulumi up
```

The API Service defaults to `LoadBalancer`. If `apiDomain` is configured, the
stack adds ExternalDNS annotations and uses `https://<apiDomain>` in its URL
outputs. `apiDomainZone` defaults to `limetry.org`:

```sh
pulumi config set apiDomain api.dev.example.com
pulumi config set apiDomainZone example.com
pulumi up
```

The cluster must have a LoadBalancer implementation for public access and an
ExternalDNS installation for automatic DNS records. Without `apiDomain`, the
stack exports the provider-assigned HTTP load-balancer URL once Kubernetes
assigns an address. This fallback is not TLS-enabled.

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
