# Limetry serverless deployment

This Pulumi program deploys the Limetry API to one of three serverless
compute providers:

- AWS Lambda with API Gateway HTTP API
- Google Cloud Run
- Azure Container Apps

Select exactly one provider with `cloudProvider`. The checked-in development
configuration defaults to AWS in `us-west-2`.

## Provider matrix

| Layer | Options | Pulumi keys / notes |
| --- | --- | --- |
| Compute | `aws`, `gcp`, `azure` | `cloudProvider`, `location` |
| Database | `neon`, `sqlite`, `rds` | `databaseProvider`; `rds` requires `aws`; Neon needs `neonApiKey` or `databaseUrl` |
| DNS | native, cloudflare, manual | `manageDns`, `dnsProvider`; native = Route 53 / Cloud DNS / Azure DNS |

See [Custom API domains and DNS](#custom-api-domains-and-dns) for per-cloud DNS
setup. For SST-based deploys, see [`packages/serverless`](../serverless/README.md).

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

## Custom API domains and DNS

Set `apiDomain` and `apiDomainZone` (apex zone, for example `limetry.dev`) to
publish HTTPS on your hostname. TLS and routing are created by the **compute**
provider; **DNS** is configured separately.

```sh
pulumi config set apiDomain test.limetry.dev
pulumi config set apiDomainZone limetry.dev
pulumi config set manageDns true
pulumi config set dnsProvider native
```

### DNS modes (`manageDns` + `dnsProvider`)

| Setting | Behavior |
| --- | --- |
| `manageDns: true`, `dnsProvider: native` (default) | Creates records in the selected cloud's DNS service |
| `manageDns: true`, `dnsProvider: cloudflare` | Creates **DNS-only** Cloudflare records (`proxied: false`) for any compute cloud |
| `manageDns: false` | No automatic records; use `pulumi stack output apiDnsRecords` at your registrar |

Legacy `manageCloudflare: true` is equivalent to `dnsProvider: cloudflare`.

### Native DNS by compute provider

**AWS — Route 53**

1. Public hosted zone for `apiDomainZone` in the deploy AWS account.
2. Domain NS delegated to Route 53 (as for `limetry.dev`).
3. Optional `apiHostedZoneId` when name lookup is ambiguous.

```sh
export AWS_PROFILE=disrupt
aws route53 list-hosted-zones-by-name --dns-name limetry.dev
```

**GCP — Cloud DNS**

1. Managed zone whose `dnsName` is `apiDomainZone.` (trailing dot in the API).
2. NS delegated from the parent domain.
3. Deploy identity can edit record sets in that zone.

**Azure — Azure DNS**

1. DNS zone named `apiDomainZone` in a resource group.
2. NS delegated from the parent domain.
3. `dnsResourceGroupName` when the zone is outside the stack resource group.

### Cloudflare DNS (optional, any compute provider)

```sh
pulumi config set dnsProvider cloudflare
pulumi config set --secret cloudflare:apiToken "<zone DNS edit token>"
# optional: pulumi config set cloudflareZoneId "<zone id>"
```

Cloudflare must already host the zone. Records are never orange-clouded so ACM
and API Gateway / Cloud Run / Container Apps terminate TLS on the cloud edge.

### Manual DNS

```sh
pulumi config set manageDns false
pulumi up
pulumi stack output apiDnsRecords
```

Create validation records first, wait for the certificate to issue, then add the
traffic CNAME. Re-run `pulumi up` if validation was pending.

Stack outputs include `dnsProvider` (`native`, `cloudflare`, or `manual`) and
`apiDnsRecords` for verification.

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
