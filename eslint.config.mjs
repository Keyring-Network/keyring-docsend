import js from "@eslint/js";
import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";
import nextPlugin from "@next/eslint-plugin-next";
import prettier from "eslint-config-prettier";
import globals from "globals";

/**
 * Strict quality gates. The bars are deliberately tight — small files, small
 * functions, low complexity, no duplication. Logic lives in lib/ where these
 * rules bite hardest; app/ gets a slightly higher function-length ceiling
 * because JSX is verbose, but the file-length and complexity caps still apply.
 */
export default tseslint.config(
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "next-env.d.ts",
      "scripts/**",
      "*.config.{js,mjs,ts}",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  sonarjs.configs.recommended,
  prettier,
  {
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      // App Router project — there is no pages/ directory.
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      complexity: ["error", 10],
      "max-lines": ["error", { max: 250, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": [
        "error",
        { max: 50, skipBlankLines: true, skipComments: true },
      ],
      "max-params": ["error", 4],
      "max-depth": ["error", 4],
      "max-nested-callbacks": ["error", 3],
      "sonarjs/cognitive-complexity": ["error", 12],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        { allowExpressions: true },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    // JSX is verbose; allow longer component bodies but keep the file cap.
    files: ["app/**/*.tsx"],
    rules: {
      "max-lines-per-function": [
        "error",
        { max: 120, skipBlankLines: true, skipComments: true },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
  {
    // Tests assert a lot in long describe blocks; relax length + complexity,
    // never relax correctness rules.
    files: ["**/*.test.ts", "**/*.test.tsx", "test/**/*.ts"],
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
      "max-nested-callbacks": "off",
      "sonarjs/no-duplicate-string": "off",
      // Tests use throwaway fake SMTP creds.
      "sonarjs/no-hardcoded-passwords": "off",
    },
  },
);
