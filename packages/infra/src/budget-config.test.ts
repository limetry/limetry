import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  DEFAULT_BUDGET_THRESHOLDS,
  parseBudgetPercent,
  resolveBudgetThresholds,
} from "./budget-config.js"

describe("budget config", () => {
  it("uses defaults when config keys are unset", () => {
    assert.deepEqual(resolveBudgetThresholds(() => undefined), DEFAULT_BUDGET_THRESHOLDS)
  })

  it("parses configured percentage thresholds", () => {
    const values: Record<string, string> = {
      budgetActualWarningPercent: "70",
      budgetActualCriticalPercent: "95",
      budgetForecastedPercent: "110",
    }
    assert.deepEqual(resolveBudgetThresholds((key) => values[key]), {
      actualWarningPercent: 70,
      actualCriticalPercent: 95,
      forecastedPercent: 110,
    })
  })

  it("rejects non-positive threshold values", () => {
    assert.throws(() => parseBudgetPercent("0", 80, "budgetActualWarningPercent"))
    assert.throws(() => parseBudgetPercent("-1", 80, "budgetActualWarningPercent"))
    assert.throws(() => parseBudgetPercent("nope", 80, "budgetActualWarningPercent"))
  })
})
