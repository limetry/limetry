import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    coverage: {
      include: [
        "src/classify.ts",
        "src/evaluate.ts",
        "src/intent.ts",
        "src/receipt.ts",
        "src/run-action.ts",
      ],
      thresholds: {
        lines: 75,
        functions: 80,
        statements: 75,
        branches: 35,
      },
    },
  },
})
