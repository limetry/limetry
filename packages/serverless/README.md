# Limetry SST serverless deployment

This package deploys the Limetry API with [SST](https://sst.dev) to AWS,
Google Cloud, or Azure. SST owns the deployment state and orchestration. AWS
uses SST's Lambda and API Gateway components; GCP and Azure use the Pulumi
providers configured by SST.

The default deployment is a low-cost SQLite evaluation deployment:

- AWS Lambda with API Gateway HTTP API
- Google Cloud Run
- Azure Container Apps
- SQLite stored in the compute instance's ephemeral filesystem

SQLite is the safe default because it requires no external credentials and
keeps the first deployment inexpensive. For shared production policy and audit
state, select a managed database explicitly.

SQLite is ephemeral and local to one compute instance. It is appropriate for
evaluation and single-instance use, not for shared production policy or audit
state. Set `LIMETRY_DATABASE_PROVIDER=sqlite` when ephemeral storage is
intentional. Set `LIMETRY_DATABASE_PROVIDER=rds` on AWS to provision:

- AWS Aurora Serverless v2
- Neon and AWS RDS incur ongoing charges. RDS is available only when
`LIMETRY_CLOUD_PROVIDER=aws`. Neon is reachable from the serverless runtimes
without placing them in a VPC, while RDS uses private AWS networking.

## Prerequisites

Install Node.js 22+, Docker, and the SST CLI. From the repository root, install
dependencies with your package manager, then run commands from this directory:

```sh
cd packages/serverless
npx sst version
```

The package manager only installs and runs tooling; the deployment configuration
does not require Corepack or a specific package manager.

Authenticate the selected cloud before deploying:

```sh
# AWS
export AWS_PROFILE=disrupt
aws sts get-caller-identity

# GCP
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID

# Azure
az login
az account set --subscription YOUR_SUBSCRIPTION_ID
```

SST stores its state in AWS because SST is AWS-first. GCP and Azure resources
are still created by their selected Pulumi provider. The AWS identity used for
all stages therefore needs permission to manage SST state, even when the target
provider is GCP or Azure.

## Deploy the default SQLite stack

The provider defaults to AWS and the location defaults to `us-west-2`:

```sh
export AWS_PROFILE=disrupt
npm run deploy
```

The same script works when invoked through Yarn, pnpm, or another npm-compatible
runner:

```sh
npm run deploy -- --stage dev
# or: yarn deploy --stage dev
# or: pnpm deploy -- --stage dev
```

The package deploy script builds the Lambda bundle, installs SST providers, and
applies the generated-platform protobuf compatibility fix before deploying.
Use the package script instead of calling `sst deploy` directly on a fresh
checkout.

The deployment creates encrypted random values for the bearer token, JWT
secret, and decision HMAC secret when the corresponding `LIMETRY_*` variables
are not supplied. Set stable values through your secret manager or deployment
environment when restoring a stack.

## Select a provider and settings

All deployment touchpoints are environment variables so the same SST stack can
be used by CI, local shells, and different package managers:

| Variable | Default | Purpose |
| --- | --- | --- |
| `LIMETRY_CLOUD_PROVIDER` | `aws` | `aws`, `gcp`, or `azure` |
| `LIMETRY_LOCATION` | provider-specific | Region or location |
| `LIMETRY_DATABASE_PROVIDER` | `sqlite` | `neon`, `rds`, or `sqlite` |
| `LIMETRY_ALLOW_PUBLIC_DATABASE` | `false` | Required for Azure managed PostgreSQL |
| `LIMETRY_API_IMAGE_REPOSITORY` | provider-created | Use an existing image |
| `LIMETRY_API_IMAGE_TAG` | `latest` | Container image tag |
| `LIMETRY_API_PATH_PREFIX` | empty | Reverse-proxy path prefix |
| `LIMETRY_API_DOMAIN` | stage default | Custom API hostname |
| `LIMETRY_API_DOMAIN_ZONE` | empty | Optional AWS Route 53 hosted-zone ID |
| `LIMETRY_API_CERTIFICATE_ID` | empty | Validated certificate ARN for AWS or resource ID for Azure |
| `LIMETRY_DATABASE_NAME` | `limetry` | PostgreSQL database name |
| `LIMETRY_DATABASE_USERNAME` | `limetry` | PostgreSQL username |
| `LIMETRY_NEON_API_KEY` | `NEON_API_KEY` | Neon API key used by Pulumi |
| `LIMETRY_NEON_ORG_ID` | empty | Neon organization id |
| `LIMETRY_NEON_PROJECT_NAME` | `limetry-serverless` | Neon project name |
| `LIMETRY_NEON_REGION` | `aws-us-east-1` | Neon deployment region |
| `LIMETRY_NEON_BRANCH_NAME` | `main` | Neon default branch name |
| `LIMETRY_NEON_ROLE_NAME` | `limetry` | Neon default role name |
| `LIMETRY_NEON_DATABASE_NAME` | stage default | Neon database name |
| `LIMETRY_MIN_INSTANCES` | `0` | Minimum serverless instances |
| `LIMETRY_MAX_INSTANCES` | `1` | Maximum serverless instances |
| `LIMETRY_MEMORY_MB` | provider-specific | Memory allocation |
| `LIMETRY_TIMEOUT_SECONDS` | `30` | Request timeout |
| `LIMETRY_SQLITE_DATABASE_PATH` | `/tmp/limetry.sqlite` | SQLite path |

Optional stable runtime secrets are supplied with `LIMETRY_BEARER_TOKEN`,
`LIMETRY_JWT_SECRET`, `LIMETRY_DECISION_HMAC_SECRET`, and
`LIMETRY_DATABASE_PASSWORD`. If omitted, SST creates encrypted random values
for the stack.

For example, deploy GCP with Neon Serverless Postgres:

```sh
export LIMETRY_CLOUD_PROVIDER=gcp
export LIMETRY_LOCATION=us-central1
export LIMETRY_DATABASE_PROVIDER=neon
export LIMETRY_NEON_API_KEY=...
npm run deploy -- --stage dev
```

Deploy AWS with Aurora/RDS:

```sh
export LIMETRY_CLOUD_PROVIDER=aws
export LIMETRY_DATABASE_PROVIDER=rds
npm run deploy -- --stage dev
```

When no image repository is supplied, GCP creates Artifact Registry and Azure
creates Azure Container Registry. Docker must be running for those deployments.
When `LIMETRY_API_IMAGE_REPOSITORY` is supplied, the stack assumes that the
tagged image already exists and does not push a replacement.

## DNS and API outputs

The API hostname defaults to `serverless-cloud.dev.limetry.org` for `dev` and
`serverless-cloud.limetry.org` for `prod` or `production`. Set
`LIMETRY_API_DOMAIN` to override it.

On AWS, the generated API URL remains available without DNS credentials. To
activate the default custom hostname, provide a validated regional ACM ARN in
`LIMETRY_API_CERTIFICATE_ID` and create the DNS CNAME at your DNS provider.
Alternatively, set `LIMETRY_API_DOMAIN_ZONE` to an AWS Route 53 hosted-zone ID
and SST will create and validate the certificate and DNS records there.

GCP creates a Cloud Run domain mapping and exposes its required DNS records in
the `dnsRecords` SST output. Azure exposes the required CNAME and `asuid` TXT
records in the same output. Add those records at the DNS provider. Azure uses
HTTP until `LIMETRY_API_CERTIFICATE_ID` references a certificate in the managed
environment; set that variable before deployment for HTTPS. The stack never
proxies DNS traffic through a CDN.

The stack exports:

- `apiUrl`
- `docsUrl`
- `openApiJsonUrl`
- `openApiYamlUrl`
- `apiImageReference`
- `apiDomain`
- `cloudProvider`
- `databaseMode`
- `databaseUrl` (secret when a managed database is selected)
- `databaseHost` (when Neon is selected)
- `neonDatabaseName` (when Neon is selected)
- `databaseConnection`

`databaseUrl` is kept secret because it contains the Neon credentials. Retrieve
the decrypted value only when needed with `sst state export --decrypt` for the
same stage, or use the Neon console. Never commit the decrypted state.
- `dnsRecords`

The documentation endpoints are `/v1/docs`, `/v1/openapi.json`, and
`/v1/openapi.yaml`.

## Local development and teardown

`sst dev` is supported for the AWS Lambda path:

```sh
npm run dev
```

For GCP and Azure, use `sst deploy` because their container and registry
resources are provisioned remotely.

Remove a non-production stage with:

```sh
npx sst remove --stage dev
```

Production is protected and retained by `sst.config.ts`. Do not remove a
production stage until its database backup and DNS migration plan are complete.
