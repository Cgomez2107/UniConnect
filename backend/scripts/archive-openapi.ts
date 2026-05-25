import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GATEWAY_DIR = resolve(__dirname, "..", "gateway");
const DOCS_DIR = resolve(__dirname, "..", "docs", "openapi");

const openApiPath = resolve(GATEWAY_DIR, "openapi.json");
const packageJsonPath = resolve(GATEWAY_DIR, "package.json");

if (!existsSync(openApiPath)) {
  console.error("[archive-openapi] ERROR: openapi.json not found. Run 'pnpm generate:openapi' first.");
  process.exit(1);
}

if (!existsSync(packageJsonPath)) {
  console.error("[archive-openapi] ERROR: package.json not found in gateway.");
  process.exit(1);
}

const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8")) as { version?: string };
const version = packageJson.version ?? "0.0.0";

const tag = `v${version}`;
const archivePath = resolve(DOCS_DIR, `${tag}.json`);

mkdirSync(DOCS_DIR, { recursive: true });

const spec = readFileSync(openApiPath, "utf-8");
writeFileSync(archivePath, spec, "utf-8");

console.log(`[archive-openapi] Archived OpenAPI spec: ${archivePath}`);
