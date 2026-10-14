[**Limetry v1.2.80**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / collectConfiguredTelemetry

# Function: collectConfiguredTelemetry()

> **collectConfiguredTelemetry**(`source?`): [`TelemetryBundle`](../type-aliases/TelemetryBundle.md)

Defined in: [probes/telemetry.ts:62](https://github.com/limetry/limetry/blob/a4abe7149ae07b5757f2fdd4b9ab51e2090b8264/packages/preflight/src/probes/telemetry.ts#L62)

Adds Sentry/PostHog env display and optional connectivity when those keys are set
on `source`. Observability never blocks startup.

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag; do not rely on ambient `process.env` inside callers.

## Returns

[`TelemetryBundle`](../type-aliases/TelemetryBundle.md)

Bundle of env checks, context lines, and probes to merge into `runPreflight`.
