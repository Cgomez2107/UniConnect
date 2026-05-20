import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/integration/sprint4/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      include: ["packages/shared-types/src/**/*.ts"],
      exclude: ["dist/**", "tests/**", "**/*.spec.ts", "**/__tests__/**"],
      thresholds: {
        lines: 80,
        branches: 70,
        functions: 70,
        statements: 80,
      },
    },
  },
});
