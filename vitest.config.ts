import { defineConfig } from "vitest/config";

/**
 * 100% coverage is enforced on lib/ — the logic layer. Everything testable
 * lives there. app/ holds only thin framework glue (route re-exports, page
 * shells, server-action wrappers) and is intentionally outside the coverage
 * gate; the logic those files call is covered here.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      exclude: ["lib/**/*.test.ts", "lib/**/index.ts"],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
      reporter: ["text", "html"],
    },
  },
});
