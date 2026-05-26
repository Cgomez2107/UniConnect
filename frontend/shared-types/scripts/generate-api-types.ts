import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const GATEWAY_SPEC_PATH = resolve(
  import.meta.dirname ?? __dirname,
  "../../../backend/gateway/src/public/openapi.json",
);

const OUTPUT_DIR = resolve(
  import.meta.dirname ?? __dirname,
  "../src/generated",
);

const OUTPUT_PATH = resolve(OUTPUT_DIR, "api.d.ts");

function main(): void {
  if (!existsSync(GATEWAY_SPEC_PATH)) {
    console.error(
      `[generate-api-types] ERROR: OpenAPI spec not found at ${GATEWAY_SPEC_PATH}`,
    );
    console.error(
      "[generate-api-types] Run 'pnpm merge:openapi' in the gateway first.",
    );
    process.exitCode = 1;
    return;
  }

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  try {
    execSync(
      `npx openapi-typescript "${GATEWAY_SPEC_PATH}" --output "${OUTPUT_PATH}"`,
      { stdio: "inherit", encoding: "utf-8" },
    );
    console.log(
      `[generate-api-types] ✅ Generated API types at ${OUTPUT_PATH}`,
    );
  } catch (err) {
    console.error(
      "[generate-api-types] ERROR: Failed to generate API types:",
      err instanceof Error ? err.message : String(err),
    );
    process.exitCode = 1;
  }
}

main();
