# Serverless Slack AWS cost control

Use the Limetry SDK in an AWS Lambda handler to check spend-shaped
action intents for Slack-triggered infrastructure commands.

## Quickstart

Offline mock demo and test suite:

```bash
# 1. Register and link dependencies
yarn install

# 2. Run the test suite
yarn workspace @examples/serverless-slack-aws-cost-control test
```

## Real vs mock

### Offline / mock (default)

Requires no cloud environment. Vitest mocks the requests and remote policy evaluation responses.

### AWS Lambda and Slack

To connect this command handler to an AWS account and a Slack workspace:

1. **Package and deploy the Lambda function**: Deployment packaging is not included. Add AWS SAM, Serverless Framework,
   Pulumi, or another deployment setup, then create an API Gateway HTTP trigger.
1. **Configure Environment Variables**:
   In your Lambda function's configuration, set:
   - `LIMETRY_API_KEY`: Your Limetry API key (or self-hosted bearer token).
   - `LIMETRY_BASE_URL`: Your Limetry server URL.
1. **Configure your Slack App**:
   - Go to your Slack API Console.
   - Create a Slack Slash Command (e.g. `/provision-infra`).
   - Set the Request URL to your API Gateway endpoint.
   - Add Slack request-signature verification before production use; this example does not implement it.
1. **Trigger Commands**:
   - `/provision-infra t3.micro` -> Returns approval message.
   - `/provision-infra g5.4xlarge` -> Returns spender block warning.

## Architecture

In Lambda, keep the handler small and evaluate over HTTP:

1. **Limetry SDK**: Checks policy against a Limetry server (no local native library).
1. **Remote evaluation**: Each invocation drafts a spend-shaped action intent and checks it with Limetry. Prefer registering
   policies server-side and calling `/v1/policy/evaluate`. Limetry returns allow/deny (+ optional signed receipt); it does
   not custody keys or settle payments.
