import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    coverage: {
      include: [
        "src/client.ts",
        "src/templates.ts",
        "src/run-ci-demo.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 75,
        statements: 80,
        branches: 50,
      },
    },
  },
})
