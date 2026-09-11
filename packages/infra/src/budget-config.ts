/**
 * AWS Budgets notification percentage parsing for the OSS stack cost budget.
 *
 * Config keys (under `limetry-oss`):
 * - `budgetActualWarningPercent` (default 80)
 * - `budgetActualCriticalPercent` (default 100)
 * - `budgetForecastedPercent` (default 100)
 */

/**
 * AWS Budgets notification percentage thresholds for the stack cost budget.
 */
export type BudgetThresholds = {
  /**
   * ACTUAL spend warning threshold percentage.
   */
  actualWarningPercent: number
  /**
   * ACTUAL spend critical threshold percentage.
   */
  actualCriticalPercent: number
  /**
   * FORECASTED spend threshold percentage.
   */
  forecastedPercent: number
}

/**
 * Default budget notification percentages used when config keys are unset.
 */
export const DEFAULT_BUDGET_THRESHOLDS: BudgetThresholds = {
  actualWarningPercent: 80,
  actualCriticalPercent: 100,
  forecastedPercent: 100,
}

/**
 * Parses a positive percentage (AWS Budgets allows values above 100 for forecasts).
 *
 * @param raw - Raw config string, or undefined / blank to use `fallback`.
 * @param fallback - Default percentage when `raw` is empty.
 * @param key - Config key name used in error messages.
 * @returns Parsed positive number.
 * @throws When `raw` is present but not a finite positive number.
 */
export function parseBudgetPercent(
  raw: string | undefined,
  fallback: number,
  key: string,
): number {
  if (raw === undefined || raw.trim() === "") {
    return fallback
  }
  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${key} must be a positive number (got ${JSON.stringify(raw)})`)
  }
  return value
}

/**
 * Resolves budget notification thresholds from Pulumi config with defaults.
 *
 * @param get - Config getter (typically `(key) => config.get(key)`).
 * @returns Resolved {@link BudgetThresholds}.
 */
export function resolveBudgetThresholds(get: (key: string) => string | undefined): BudgetThresholds {
  return {
    actualWarningPercent: parseBudgetPercent(
      get("budgetActualWarningPercent"),
      DEFAULT_BUDGET_THRESHOLDS.actualWarningPercent,
      "budgetActualWarningPercent",
    ),
    actualCriticalPercent: parseBudgetPercent(
      get("budgetActualCriticalPercent"),
      DEFAULT_BUDGET_THRESHOLDS.actualCriticalPercent,
      "budgetActualCriticalPercent",
    ),
    forecastedPercent: parseBudgetPercent(
      get("budgetForecastedPercent"),
      DEFAULT_BUDGET_THRESHOLDS.forecastedPercent,
      "budgetForecastedPercent",
    ),
  }
}
