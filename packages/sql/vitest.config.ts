import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    coverage: {
      include: [
        "src/classify-sql.ts",
        "src/gate.ts",
        "src/run-ci-demo.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 70,
        statements: 80,
        branches: 60,
      },
    },
  },
})
