# Limetry SST serverless deployment

This package deploys the Limetry API with [SST](https://sst.dev) to AWS,
Google Cloud, or Azure. SST owns the deployment state and orchestration. AWS
uses SST's Lambda and API Gateway components; GCP and Azure use the Pulumi
providers configured by SST.

The default deployment is a low-cost SQLite deployment:

- AWS Lambda with API Gateway HTTP API
- Google Cloud Run
- Azure Container Apps
- SQLite at `/tmp/limetry.sqlite`
- zero managed database resources

SQLite is ephemeral and local to one compute instance. It is appropriate for
evaluation and single-instance use, not for shared production policy or audit
state. Set `LIMETRY_MANAGED_DATABASE=true` to provision the smallest supported
managed PostgreSQL option:

- AWS Aurora Serverless v2
- GCP Cloud SQL shared-core PostgreSQL
- Azure PostgreSQL Flexible Server

Managed databases incur ongoing charges. Azure's managed database mode also
requires `LIMETRY_ALLOW_PUBLIC_DATABASE=true` because this stack does not
create Azure VNet integration. Use private networking before storing sensitive
production data.

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
npx sst deploy --stage dev
```

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
| `LIMETRY_MANAGED_DATABASE` | `false` | Provision managed PostgreSQL |
| `LIMETRY_ALLOW_PUBLIC_DATABASE` | `false` | Required for Azure managed PostgreSQL |
| `LIMETRY_API_IMAGE_REPOSITORY` | provider-created | Use an existing image |
| `LIMETRY_API_IMAGE_TAG` | `latest` | Container image tag |
| `LIMETRY_API_PATH_PREFIX` | empty | Reverse-proxy path prefix |
| `LIMETRY_API_DOMAIN` | generated URL | Custom API hostname |
| `LIMETRY_API_DOMAIN_ZONE` | provider lookup | AWS Route 53 hosted-zone ID |
| `LIMETRY_API_CERTIFICATE_ID` | empty | Azure managed-environment certificate resource ID |
| `LIMETRY_DATABASE_NAME` | `limetry` | PostgreSQL database name |
| `LIMETRY_DATABASE_USERNAME` | `limetry` | PostgreSQL username |
| `LIMETRY_MIN_INSTANCES` | `0` | Minimum serverless instances |
| `LIMETRY_MAX_INSTANCES` | `1` | Maximum serverless instances |
| `LIMETRY_MEMORY_MB` | provider-specific | Memory allocation |
| `LIMETRY_TIMEOUT_SECONDS` | `30` | Request timeout |
| `LIMETRY_SQLITE_DATABASE_PATH` | `/tmp/limetry.sqlite` | SQLite path |

Optional stable runtime secrets are supplied with `LIMETRY_BEARER_TOKEN`,
`LIMETRY_JWT_SECRET`, `LIMETRY_DECISION_HMAC_SECRET`, and
`LIMETRY_DATABASE_PASSWORD`. If omitted, SST creates encrypted random values
for the stack.

For example, deploy GCP with SQLite:

```sh
export LIMETRY_CLOUD_PROVIDER=gcp
export LIMETRY_LOCATION=us-central1
npm run deploy -- --stage dev
```

Deploy Azure with the managed database:

```sh
export LIMETRY_CLOUD_PROVIDER=azure
export LIMETRY_LOCATION=westus2
export LIMETRY_MANAGED_DATABASE=true
export LIMETRY_ALLOW_PUBLIC_DATABASE=true
npm run deploy -- --stage dev
```

When no image repository is supplied, GCP creates Artifact Registry and Azure
creates Azure Container Registry. Docker must be running for those deployments.
When `LIMETRY_API_IMAGE_REPOSITORY` is supplied, the stack assumes that the
tagged image already exists and does not push a replacement.

## DNS and API outputs

Set `LIMETRY_API_DOMAIN` to request a custom hostname. On AWS, SST creates the
API Gateway custom domain and Route 53 records. Set `LIMETRY_API_DOMAIN_ZONE`
when more than one Route 53 zone matches the hostname.

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
- `cloudProvider`
- `databaseMode`
- `databaseConnection`
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
