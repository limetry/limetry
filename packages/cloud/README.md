# Limetry Cloud self-host stack

This Pulumi program deploys the OSS evaluate API to a Kubernetes-compatible
cluster. That includes local Kubernetes, managed Kubernetes, and private-cloud
clusters without changing the application deployment code.

The stack does not deploy `packages/web`. The OSS website remains an example
deployment in `packages/infra`.

## SQLite default

The default uses one SQLite file on a persistent volume and one API replica:

```sh
pulumi config set --secret bearerToken "replace-with-a-long-token"
pulumi config set --secret jwtSecret "replace-with-a-long-secret"
pulumi up
```

Build the OSS server image using the repository's container workflow and load
it into the target cluster, or set `apiImage` to a registry image:

```sh
pulumi config set apiImage ghcr.io/example/limetry-server:latest
```

## Postgres mode

For multiple API replicas, set `usePostgres=true`, `replicas`, `databaseUrl`,
and `postgresPassword`. Use a managed Postgres service for production; the
optional in-cluster Postgres resource is intended for development.

```sh
pulumi config set usePostgres true
pulumi config set replicas 2
pulumi config set --secret databaseUrl "postgresql://limetry:password@postgres.example/limetry"
pulumi config set --secret postgresPassword "password"
pulumi up
```
