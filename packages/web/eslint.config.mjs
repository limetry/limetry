/**
 * Web ESLint entry so Next.js detects `@next/eslint-plugin-next` during builds.
 *
 * Next probes `calculateConfigForFile(eslint.config.mjs)`. The plugin must apply
 * to `*.mjs` paths relative to this package, or Next reports it as missing.
 *
 * better-tailwindcss `entryPoint` is relative to this package root when Next/ESLint
 * runs from `packages/web` (the monorepo root config uses `packages/web/...`).
 */
import nextPlugin from "@next/eslint-plugin-next"

import rootConfig from "../../eslint.config.mjs"

/**
 * Shared wrapping options — keep in sync with the monorepo root config.
 */
const betterTailwindLineWrapping = [
  "error",
  {
    indent: 2,
    printWidth: 100,
    preferSingleLine: true,
    group: "newLine",
  },
]

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
      "better-tailwindcss": {
        entryPoint: "src/app/globals.css",
      },
    },
    rules: {
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@next/next/no-html-link-for-pages": ["error", "src/app/"],
      "better-tailwindcss/enforce-consistent-line-wrapping": betterTailwindLineWrapping,
    },
  },
  {
    files: ["**/*.jsx", "**/*.tsx"],
    rules: {
      /**
       * Core `indent` fights better-tailwindcss wrapping inside JSX `className`.
       */
      "indent": "off",
    },
  },
]
