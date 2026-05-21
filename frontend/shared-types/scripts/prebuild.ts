import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const GENERATED_DIR = resolve(
  import.meta.dirname ?? __dirname,
  "../src/generated",
);
const OUTPUT_PATH = resolve(GENERATED_DIR, "api.d.ts");

if (!existsSync(OUTPUT_PATH)) {
  if (!existsSync(GENERATED_DIR)) {
    mkdirSync(GENERATED_DIR, { recursive: true });
  }
  writeFileSync(
    OUTPUT_PATH,
    [
      "// Placeholder — run `pnpm generate:api-types` to regenerate from OpenAPI spec",
      "export interface paths {}",
      "export interface components { schemas: Record<string, unknown>; }",
      "export type operations = Record<string, unknown>;",
      "",
    ].join("\n"),
    "utf-8",
  );
  console.log("[prebuild] Created stub src/generated/api.d.ts");
}
