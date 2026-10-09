# Limetry serverless deployment

This Pulumi program deploys the Limetry API to one of three serverless
compute providers:

- AWS Lambda with API Gateway HTTP API
- Google Cloud Run
- Azure Container Apps

Select exactly one provider with `cloudProvider`. The checked-in development
configuration defaults to AWS in `us-west-2`.

## Persistence defaults

The default is Neon Serverless Postgres:

```text
databaseProvider=neon
neonRegion=aws-us-east-1
NODE_ENV=serverless
```

The checked-in `dev` Pulumi stack selects SQLite so a fresh local preview does
not require external database credentials. Set `databaseProvider=neon` when
deploying a shared durable database.

The `/tmp` filesystem is ephemeral and local to one serverless instance. It
is suitable for demos and single-instance evaluation only. It is not a
durable shared database, and scaling to multiple instances can produce
different policy and audit state in different instances.

The `serverless` runtime marker keeps SQLite-compatible startup preflight
enabled while still requiring production-strength bearer, JWT, and HMAC
secrets.

Set `databaseProvider=sqlite` for ephemeral local storage, or
`databaseProvider=rds` with `cloudProvider=aws` to provision:

AWS provisions Aurora Serverless v2, starting at 0.5 ACU, in the default VPC.
Neon is managed outside the selected compute provider and uses a pooled
connection string. RDS uses private AWS connectivity from Lambda.

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
descriptions, security groups, and, when `databaseProvider=rds`, Aurora and
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
service accounts, IAM, and Neon API access when the default database is used.

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
Container Registry, and Neon API access when the default database is used.

## Secrets and configuration

The stack generates encrypted Pulumi secrets for `bearerToken`, `jwtSecret`,
and `decisionHmacSecret`. RDS also generates `databasePassword` when it is
selected. Neon can either provision a project with `NEON_API_KEY`,
`LIMETRY_NEON_API_KEY`, or encrypted `neonApiKey`, or use an existing pooled
connection string from encrypted `databaseUrl`. The stack deliberately does
not import the shell's `DATABASE_URL`, because local development values can
otherwise point a deployed Lambda at `localhost`.
Provide stable values explicitly when rotating or restoring a deployment:

```sh
pulumi config set --secret bearerToken "replace-with-a-long-token"
pulumi config set --secret jwtSecret "replace-with-a-long-secret"
pulumi config set --secret decisionHmacSecret "replace-with-a-long-secret"
pulumi config set --secret databasePassword "replace-with-a-long-password"
pulumi config set --secret neonApiKey "replace-with-a-neon-api-key"
pulumi config set --secret databaseUrl "postgresql://USER:PASSWORD@HOST/neondb?sslmode=verify-full"
```

Useful settings include:

- `apiImageRepository`: existing image repository instead of the provider-
  created registry. Configure image-pull credentials through the target
  provider when the repository is private.
- `apiImageTag`: image tag, default `latest`.
- `apiPathPrefix`: path prefix when the API is behind another proxy.
- `minInstances` and `maxInstances`: Cloud Run or Container Apps scaling.
- `memoryMb` and `timeoutSeconds`: serverless compute sizing.

## Custom API domains

Set `apiDomain` to publish the API at a provider-native HTTPS hostname. The
stack provisions native TLS/custom-domain resources and DNS records through the
selected cloud provider:

```sh
pulumi config set apiDomain api.dev.example.com
pulumi config set apiDomainZone example.com
pulumi config set manageDns true
```

AWS uses Route 53, Google Cloud uses Cloud DNS, and Azure uses Azure DNS. The
configured cloud identity must have permission to read the hosted zone and
create records. For Azure, set `dnsResourceGroupName` when the DNS zone is in a
different resource group:

```sh
pulumi config set dnsResourceGroupName dns-resource-group
```

The API's provider endpoint remains available through the `apiUrl` stack output.

## Outputs and teardown

```sh
pulumi stack output apiUrl
pulumi stack output databaseMode
pulumi stack output databaseUrl
# Use --show-secrets only when the connection string is needed.
pulumi stack output --show-secrets databaseUrl
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
