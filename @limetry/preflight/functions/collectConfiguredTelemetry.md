[**Limetry v1.2.87**](../../../README.md)

***

[Limetry](../../../README.md) / [@limetry/preflight](../README.md) / collectConfiguredTelemetry

# Function: collectConfiguredTelemetry()

> **collectConfiguredTelemetry**(`source?`): [`TelemetryBundle`](../type-aliases/TelemetryBundle.md)

Defined in: [probes/telemetry.ts:62](https://github.com/limetry/limetry/blob/f14000dfffe19a47b41e78212d02a5eb934e0d18/packages/preflight/src/probes/telemetry.ts#L62)

Adds Sentry/PostHog env display and optional connectivity when those keys are set
on `source`. Observability never blocks startup.

## Parameters

### source?

`ProcessEnv` = `process.env`

Injected env bag; do not rely on ambient `process.env` inside callers.

## Returns

[`TelemetryBundle`](../type-aliases/TelemetryBundle.md)

Bundle of env checks, context lines, and probes to merge into `runPreflight`.
