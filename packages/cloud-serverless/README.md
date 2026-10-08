# Limetry serverless deployment

This Pulumi program deploys the Limetry API to one of three serverless
compute providers:

- AWS Lambda with API Gateway HTTP API
- Google Cloud Run
- Azure Container Apps

Select exactly one provider with `cloudProvider`. The checked-in development
configuration defaults to AWS in `us-west-2`.

## Persistence defaults

The default is SQLite:

```text
managedDatabase=false
SQLITE_DATABASE_PATH=/tmp/limetry.sqlite
```

The `/tmp` filesystem is ephemeral and local to one serverless instance. It
is suitable for demos and single-instance evaluation only. It is not a
durable shared database, and scaling to multiple instances can produce
different policy and audit state in different instances.

Set `managedDatabase=true` to provision PostgreSQL supported by the selected
provider:

- AWS: Aurora Serverless v2, starting at 0.5 ACU, in the default VPC.
- GCP: the smallest shared-core Cloud SQL PostgreSQL instance.
- Azure: the smallest burstable PostgreSQL Flexible Server tier.

AWS and GCP use private/provider-managed connectivity. Azure Container Apps
does not have a stable egress address without VNet integration, so Azure
requires `allowPublicDatabase=true` and creates a temporary allow rule for
the public database. Do not use that mode for sensitive production data;
configure Azure VNet integration before production use.

Managed PostgreSQL adds ongoing charges even when request volume is low. Review
the current provider pricing before enabling it. `pulumi destroy` removes the
database resources, but backups or retained snapshots may incur separate
charges.

## Prerequisites

Install Node.js 22+, Docker, Pulumi, and the repository dependencies:

```sh
yarn install
```

Build the Lambda bundle before an AWS deployment:

```sh
yarn build:sdk
yarn build:preflight
yarn build:server
yarn workspace @limetry/server build:lambda
```

The GCP and Azure adapters build and push the API container from
`packages/server/Dockerfile` during `pulumi up`.

## AWS

```sh
export AWS_PROFILE=disrupt
cd packages/cloud-serverless
pulumi stack init dev
pulumi config set cloudProvider aws
pulumi config set location us-west-2
pulumi preview
pulumi up
```

The AWS identity needs permissions for Lambda, API Gateway, IAM, VPC
descriptions, security groups, and, when `managedDatabase=true`, Aurora and
subnet resources. The managed database uses the default VPC and private
security-group access from Lambda.

## Google Cloud

```sh
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
cd packages/cloud-serverless
pulumi stack init gcp-dev
pulumi config set cloudProvider gcp
pulumi config set location us-central1
pulumi preview
pulumi up
```

The Google identity needs permissions for Artifact Registry, Cloud Run,
service accounts, IAM, and, when enabled, Cloud SQL.

## Azure

```sh
az login
cd packages/cloud-serverless
pulumi stack init azure-dev
pulumi config set cloudProvider azure
pulumi config set location westus2
pulumi preview
pulumi up
```

The Azure identity needs permissions for resource groups, Container Apps,
Container Registry, and, when enabled, PostgreSQL Flexible Server. Azure
managed database mode also requires:

```sh
pulumi config set allowPublicDatabase true
```

That setting is intentionally not enabled by default.

## Secrets and configuration

The stack generates encrypted Pulumi secrets for `bearerToken`, `jwtSecret`,
`decisionHmacSecret`, and `databasePassword` when they are not supplied.
Provide stable values explicitly when rotating or restoring a deployment:

```sh
pulumi config set --secret bearerToken "replace-with-a-long-token"
pulumi config set --secret jwtSecret "replace-with-a-long-secret"
pulumi config set --secret decisionHmacSecret "replace-with-a-long-secret"
pulumi config set --secret databasePassword "replace-with-a-long-password"
```

Useful settings include:

- `apiImageRepository`: existing image repository instead of the provider-
  created registry. Configure image-pull credentials through the target
  provider when the repository is private.
- `apiImageTag`: image tag, default `latest`.
- `apiPathPrefix`: path prefix when the API is behind another proxy.
- `minInstances` and `maxInstances`: Cloud Run or Container Apps scaling.
- `memoryMb` and `timeoutSeconds`: serverless compute sizing.

## Outputs and teardown

```sh
pulumi stack output apiUrl
pulumi stack output databaseMode
pulumi destroy
```

Do not remove the Pulumi stack until `pulumi destroy` completes. The stack
does not delete an existing image repository configured with
`apiImageRepository`.
 # AWS TypeScript Pulumi Template

 A minimal Pulumi template for provisioning AWS infrastructure using TypeScript. This template creates an Amazon S3 bucket and exports its name.

 ## Prerequisites

 - Pulumi CLI (>= v3): https://www.pulumi.com/docs/get-started/install/
 - Node.js (>= 14): https://nodejs.org/
 - AWS credentials configured (e.g., via `aws configure` or environment variables)

 ## Getting Started

 1. Initialize a new Pulumi project:

    ```bash
    pulumi new aws-typescript
    ```

    Follow the prompts to set your:
    - Project name
    - Project description
    - AWS region (defaults to `us-east-1`)

 2. Preview and deploy your infrastructure:

    ```bash
    pulumi preview
    pulumi up
    ```

 3. When you're finished, tear down your stack:

    ```bash
    pulumi destroy
    pulumi stack rm
    ```

 ## Project Layout

 - `Pulumi.yaml` — Pulumi project and template metadata
 - `index.ts` — Main Pulumi program (creates an S3 bucket)
 - `package.json` — Node.js dependencies
 - `tsconfig.json` — TypeScript compiler options

 ## Configuration

 | Key           | Description                             | Default     |
 | ------------- | --------------------------------------- | ----------- |
 | `aws:region`  | The AWS region to deploy resources into | `us-east-1` |

 Use `pulumi config set <key> <value>` to customize configuration.

 ## Next Steps

 - Extend `index.ts` to provision additional resources (e.g., VPCs, Lambda functions, DynamoDB tables).
 - Explore [Pulumi AWSX](https://www.pulumi.com/docs/reference/pkg/awsx/) for higher-level AWS components.
 - Consult the [Pulumi documentation](https://www.pulumi.com/docs/) for more examples and best practices.

 ## Getting Help

 If you encounter any issues or have suggestions, please open an issue in this repository.