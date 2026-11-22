import eslint from "@eslint/js"
import nextPlugin from "@next/eslint-plugin-next"
import betterTailwind from "eslint-plugin-better-tailwindcss"
import reactPlugin from "eslint-plugin-react"
import reactHooks from "eslint-plugin-react-hooks"
import simpleImportSort from "eslint-plugin-simple-import-sort"
import tsdoc from "eslint-plugin-tsdoc"
import globals from "globals"
import tseslint from "typescript-eslint"

/**
 * Shared better-tailwindcss wrapping options.
 *
 * `preferSingleLine` keeps short class strings on one line; longer strings and
 * template ternaries wrap with 2-space indent matching the repo style.
 * Core ESLint `indent` is disabled for JSX/TSX so it does not fight this rule.
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

/**
 * Limetry OSS — single root flat ESLint config for packages, examples, and scripts.
 * Style rules match the workspace standard (double quotes, no semis, import sort,
 * no inline comments). Prefer typed product env + TSDoc over ambient process.env.
 */
export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "**/.next/**",
      "**/.sst/**",
      "**/.source/**",
      "**/.turbo/**",
      "**/.vercel/**",
      "**/.yarn/**",
      "**/build/**",
      "**/coverage/**",
      "**/dist/**",
      "**/lambda-bundle/**",
      "**/lambda-dist/**",
      "**/node_modules/**",
      "**/next-env.d.ts",
      "**/out/**",
      "**/sdks/**",
      "**/sst-env.d.ts",
      "archive/**",
      "docs/api/**",
      "packages/cloud/**",
      "packages/pulumi-neon/**",
      "target/**",
    ],
  },
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs", "**/*.ts", "**/*.tsx"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "better-tailwindcss": betterTailwind,
      "simple-import-sort": simpleImportSort,
      tsdoc,
      react: reactPlugin,
      "react-hooks": reactHooks,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...betterTailwind.configs["stylistic-error"].rules,
      "better-tailwindcss/enforce-consistent-line-wrapping": betterTailwindLineWrapping,
      /**
       * Custom design tokens / NativeWind class names are intentional; keep
       * unknown-class reporting off while still enforcing wrap + order.
       */
      "better-tailwindcss/no-unknown-classes": "off",
      "better-tailwindcss/no-restricted-classes": "off",
      "comma-dangle": ["error", "always-multiline"],
      "indent": ["error", 2, { SwitchCase: 1 }],
      "no-inline-comments": "error",
      "no-trailing-spaces": "error",
      "quotes": ["error", "double", { avoidEscape: true }],
      "semi": ["error", "never"],
      "simple-import-sort/exports": "error",
      "simple-import-sort/imports": "error",
      "tsdoc/syntax": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
          disallowTypeAnnotations: false,
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "react/display-name": "off",
      "react/no-unescaped-entities": "off",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["**/*.jsx", "**/*.tsx"],
    ...reactPlugin.configs.flat.recommended,
    rules: {
      ...reactPlugin.configs.flat.recommended.rules,
      "react/display-name": "off",
      "react/no-unescaped-entities": "off",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      /**
       * Core `indent` conflicts with better-tailwindcss multiline class strings
       * and template-literal ternaries inside `className`. Defer to
       * `enforce-consistent-line-wrapping` (indent: 2) for those.
       */
      "indent": "off",
    },
  },
  {
    files: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "tsdoc/syntax": "off",
    },
  },
  {
    files: ["scripts/**/*.js", "scripts/**/*.mjs", "scripts/**/*.ts", "examples/**/*.js", "examples/**/*.mjs", "examples/**/*.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-console": "off",
    },
  },
  {
    files: ["**/*.mjs", "packages/limetry-skill/**"],
    rules: {
      "tsdoc/syntax": "off",
    },
  },
  {
    files: [
      "packages/ui/**/*.js",
      "packages/ui/**/*.jsx",
      "packages/ui/**/*.mjs",
      "packages/ui/**/*.ts",
      "packages/ui/**/*.tsx",
    ],
    settings: {
      "better-tailwindcss": {
        entryPoint: "packages/ui/src/global.css",
        tailwindConfig: "packages/ui/tailwind.config.ts",
      },
    },
  },
  {
    files: [
      "packages/web/**/*.js",
      "packages/web/**/*.jsx",
      "packages/web/**/*.mjs",
      "packages/web/**/*.cjs",
      "packages/web/**/*.ts",
      "packages/web/**/*.tsx",
    ],
    plugins: {
      "@next/next": nextPlugin,
    },
    settings: {
      next: {
        rootDir: "packages/web/",
      },
      "better-tailwindcss": {
        entryPoint: "packages/web/src/app/globals.css",
      },
    },
    rules: {
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@next/next/no-html-link-for-pages": ["error", "packages/web/src/app/"],
    },
  },
)
