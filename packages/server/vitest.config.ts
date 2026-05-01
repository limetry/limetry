/**
 * Vitest configuration for `\@limetry/server` unit tests and coverage gates.
 */

import { defineConfig } from "vitest/config"

/**
 * Vitest project config: forks pool, serial files, and coverage thresholds for
 * action evaluation and decision-receipt helpers.
 */
export default defineConfig({
  test: {
    pool: "forks",
    fileParallelism: false,
    coverage: {
      include: [
        "src/services/action-evaluator.ts",
        "src/services/decision-receipt.ts",
      ],
      thresholds: {
        lines: 65,
        functions: 80,
        statements: 65,
        branches: 60,
      },
    },
  },
})
