import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: [
      "tests/integration/sprint4/**/*.spec.ts",
      "tests/integration/us-*.spec.ts",
      "tests/unit/notification.service.spec.ts",
      "shared/patterns/chain/message/__tests__/moderation-us-t06.spec.ts",
      "shared/patterns/strategy/__tests__/*.spec.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov", "html"],
      include: ["packages/shared-types/src/**/*.ts"],
      exclude: ["dist/**", "tests/**", "**/*.spec.ts", "**/*.test.ts", "**/__tests__/**"],
      thresholds: {
        lines: 80,
        branches: 70,
        functions: 70,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: [
      {
        find: /^@uniconnect\/shared-types\/contracts\/(.+)$/,
        replacement: path.resolve(__dirname, "../packages/shared-types/src/api/$1.contract"),
      },
      {
        find: /^@uniconnect\/shared-types\/schemas\/(.+)$/,
        replacement: path.resolve(__dirname, "../packages/shared-types/src/schemas/$1.schema"),
      },
      {
        find: "@uniconnect/shared-types",
        replacement: path.resolve(__dirname, "../packages/shared-types/src/index.ts"),
      },
    ],
  },
});