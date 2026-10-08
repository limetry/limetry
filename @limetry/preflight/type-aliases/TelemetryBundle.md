[**Limetry v1.2.64-dev.cloud-agnostic-deploymen.5**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / TelemetryBundle

# Type Alias: TelemetryBundle

> **TelemetryBundle** = `object`

Defined in: [probes/telemetry.ts:40](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/probes/telemetry.ts#L40)

Env checks, context lines, and probes for optional observability backends.

## Properties

### configuration

> **configuration**: `string`[]

Defined in: [probes/telemetry.ts:44](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/probes/telemetry.ts#L44)

Non-pass/fail context lines (e.g. annotated PostHog host).

***

### envChecks

> **envChecks**: [`PreflightCheck`](PreflightCheck.md)[]

Defined in: [probes/telemetry.ts:48](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/probes/telemetry.ts#L48)

Optional secret/env checks for configured backends.

***

### probes

> **probes**: [`ConnectivityProbe`](ConnectivityProbe.md)[]

Defined in: [probes/telemetry.ts:52](https://github.com/limetry/limetry/blob/0ba645f76f2b548f00af8a3389f9a5596e536b90/packages/preflight/src/probes/telemetry.ts#L52)

Optional connectivity probes; never critical for startup.
