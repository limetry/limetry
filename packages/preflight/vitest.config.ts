import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    coverage: {
      include: [
        "src/**/*.ts",
      ],
      exclude: [
        "src/**/*.test.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70,
      },
    },
  },
})
