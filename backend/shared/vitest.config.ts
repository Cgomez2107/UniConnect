import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["patterns/chain/message/__tests__/moderation-us-t06.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov", "html"],
      include: [
        "patterns/chain/message/LongitudHandler.ts",
        "patterns/chain/message/PalabrasProhibidasHandler.ts",
        "patterns/chain/message/SpamHandler.ts",
        "patterns/chain/message/EnlacesExternosHandler.ts",
        "patterns/chain/message/MessageValidator.ts",
      ],
      thresholds: {
        lines: 90,
        branches: 80,
        functions: 85,
        statements: 90,
      },
    },
  },
});
