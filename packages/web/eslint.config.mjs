/**
 * Web ESLint entry so Next.js detects `@next/eslint-plugin-next` during builds.
 *
 * Next probes `calculateConfigForFile(eslint.config.mjs)`. The plugin must apply
 * to `*.mjs` paths relative to this package, or Next reports it as missing.
 */
import nextPlugin from "@next/eslint-plugin-next"

import rootConfig from "../../eslint.config.mjs"

export default [
  ...rootConfig,
  {
    files: [
      "**/*.js",
      "**/*.jsx",
      "**/*.mjs",
      "**/*.cjs",
      "**/*.ts",
      "**/*.tsx",
    ],
    plugins: {
      "@next/next": nextPlugin,
    },
    settings: {
      next: {
        rootDir: ".",
      },
    },
    rules: {
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@next/next/no-html-link-for-pages": ["error", "src/app/"],
    },
  },
]
