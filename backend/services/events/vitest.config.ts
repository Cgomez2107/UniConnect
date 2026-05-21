import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/integration/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      include: ["src/interfaces/http/**/*.ts"],
      exclude: ["src/**/*.d.ts", "src/main.ts"],
    },
  },
});
