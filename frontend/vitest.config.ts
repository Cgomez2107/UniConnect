import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["components/**/__tests__/**/*.test.tsx", "app/**/__tests__/**/*.test.tsx"],
  },
});
