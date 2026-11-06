[**Limetry v1.2.85**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / collectConfiguredTelemetry

# Function: collectConfiguredTelemetry()

> **collectConfiguredTelemetry**(`source?`): [`TelemetryBundle`](../type-aliases/TelemetryBundle.md)

Defined in: [probes/telemetry.ts:62](https://github.com/limetry/limetry/blob/a92c96e29b937113a9a42b230a461a37c4719e91/packages/preflight/src/probes/telemetry.ts#L62)

Adds Sentry/PostHog env display and optional connectivity when those keys are set
on `source`. Observability never blocks startup.

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag; do not rely on ambient `process.env` inside callers.

## Returns

[`TelemetryBundle`](../type-aliases/TelemetryBundle.md)

Bundle of env checks, context lines, and probes to merge into `runPreflight`.
