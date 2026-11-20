[**Limetry v1.2.95**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / collectConfiguredTelemetry

# Function: collectConfiguredTelemetry()

> **collectConfiguredTelemetry**(`source?`): [`TelemetryBundle`](../type-aliases/TelemetryBundle.md)

Defined in: [probes/telemetry.ts:62](https://github.com/limetry/limetry/blob/a7611e6e95f8c7e1ea98c503d1daeb65dbc76a3c/packages/preflight/src/probes/telemetry.ts#L62)

Adds Sentry/PostHog env display and optional connectivity when those keys are set
on `source`. Observability never blocks startup.

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag; do not rely on ambient `process.env` inside callers.

## Returns

[`TelemetryBundle`](../type-aliases/TelemetryBundle.md)

Bundle of env checks, context lines, and probes to merge into `runPreflight`.
