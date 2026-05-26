import { existsSync, mkdirSync, cpSync } from "node:fs";
import { resolve } from "node:path";

const SRC = resolve(
  import.meta.dirname ?? __dirname,
  "../src/generated/api.d.ts",
);
const DST_DIR = resolve(
  import.meta.dirname ?? __dirname,
  "../dist/generated",
);
const DST = resolve(DST_DIR, "api.d.ts");

if (existsSync(SRC) && !existsSync(DST)) {
  if (!existsSync(DST_DIR)) {
    mkdirSync(DST_DIR, { recursive: true });
  }
  cpSync(SRC, DST);
  console.log("[postbuild] Copied generated/api.d.ts to dist/");
}
