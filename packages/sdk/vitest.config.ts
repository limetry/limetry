import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    coverage: {
      include: [
        "src/privacy/redact.ts",
        "src/policy/slim-policy.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 60,
      },
    },
  },
})
