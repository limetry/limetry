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
      "**/out/**",
      "archive/**",
      "docs/api/**",
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
    },
    rules: {
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@next/next/no-html-link-for-pages": ["error", "packages/web/src/app/"],
    },
  },
)
