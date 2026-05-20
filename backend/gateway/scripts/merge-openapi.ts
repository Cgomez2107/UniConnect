import {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { OpenAPIBuilder } from "../../shared/contracts/openapi/index.js";
import type { OpenAPIPartial } from "../../shared/contracts/openapi/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = resolve(__dirname, "../../");
const SERVICES_DIR = resolve(BACKEND_ROOT, "services");
const OUTPUT_PATH = resolve(__dirname, "../src/public/openapi.json");

function getBackendVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(resolve(BACKEND_ROOT, "package.json"), "utf-8"),
    ) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    console.warn(
      "[merge-openapi] ⚠️ Could not read backend/package.json version — falling back to 0.0.0",
    );
    return "0.0.0";
  }
}

function collectPartials(): OpenAPIPartial[] {
  const partials: OpenAPIPartial[] = [];
  const serviceDirs = readdirSync(SERVICES_DIR, { withFileTypes: true });

  for (const entry of serviceDirs) {
    if (!entry.isDirectory()) continue;

    const partialPath = resolve(
      SERVICES_DIR,
      entry.name,
      "src",
      "openapi",
      "openapi.partial.json",
    );

    if (!existsSync(partialPath)) {
      console.log(
        `[merge-openapi] ℹ️ Skipping "${entry.name}" — no openapi.partial.json found`,
      );
      continue;
    }

    try {
      const raw = readFileSync(partialPath, "utf-8");
      const parsed = JSON.parse(raw) as OpenAPIPartial;
      partials.push(parsed);
      console.log(
        `[merge-openapi] ✅ Loaded partial from "${entry.name}" (${Object.keys(parsed.paths).length} paths, ${Object.keys(parsed.components?.schemas ?? {}).length} schemas)`,
      );
    } catch (err) {
      console.warn(
        `[merge-openapi] ⚠️ Failed to parse partial for "${entry.name}": ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return partials;
}

function main(): void {
  console.log("[merge-openapi] 🔄 Starting OpenAPI spec merge...");

  const partials = collectPartials();

  if (partials.length === 0) {
    console.warn(
      "[merge-openapi] ⚠️ No partials found — generating minimal spec",
    );
  }

  const merged = OpenAPIBuilder.merge(partials);
  merged.info.version = getBackendVersion();

  const outputDir = dirname(OUTPUT_PATH);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(merged, null, 2), "utf-8");

  const totalPaths = Object.keys(merged.paths).length;
  const totalSchemas = Object.keys(merged.components.schemas).length;
  const totalTags = merged.tags.length;

  console.log(
    `[merge-openapi] ✅ OpenAPI spec written to ${OUTPUT_PATH}`,
  );
  console.log(
    `[merge-openapi] 📊 Summary: ${totalPaths} paths, ${totalSchemas} schemas, ${totalTags} tags, ${merged.servers.length} servers`,
  );
}

main();
