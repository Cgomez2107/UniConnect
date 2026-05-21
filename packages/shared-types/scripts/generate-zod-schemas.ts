import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const GATEWAY_SPEC_PATH = resolve(
  import.meta.dirname ?? __dirname,
  "../../../backend/gateway/src/public/openapi.json",
);

const OUTPUT_DIR = resolve(
  import.meta.dirname ?? __dirname,
  "../src/generated",
);

const OUTPUT_PATH = resolve(OUTPUT_DIR, "zod.ts");

interface OpenAPISchema {
  type?: string;
  properties?: Record<string, OpenAPISchema>;
  items?: OpenAPISchema;
  enum?: string[];
  $ref?: string;
  oneOf?: OpenAPISchema[];
  anyOf?: OpenAPISchema[];
  allOf?: OpenAPISchema[];
  required?: string[];
  description?: string;
  format?: string;
  nullable?: boolean;
  additionalProperties?: boolean | OpenAPISchema;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  pattern?: string;
}

interface OpenAPIComponents {
  schemas: Record<string, OpenAPISchema>;
}

function toZodSchema(name: string, schema: OpenAPISchema, schemas: Record<string, OpenAPISchema>): string {
  if (schema.$ref) {
    const refName = schema.$ref.replace("#/components/schemas/", "");
    return `${sanitizeName(refName)}Schema`;
  }

  if (schema.nullable) {
    return `${toZodSchema(name, { ...schema, nullable: undefined }, schemas)}.nullable()`;
  }

  if (schema.oneOf && schema.oneOf.length > 0) {
    return `z.union([${schema.oneOf.map((s, i) => toZodSchema(`${name}_oneof_${i}`, s, schemas)).join(", ")}])`;
  }

  if (schema.anyOf && schema.anyOf.length > 0) {
    return `z.union([${schema.anyOf.map((s, i) => toZodSchema(`${name}_anyof_${i}`, s, schemas)).join(", ")}])`;
  }

  if (schema.allOf && schema.allOf.length > 0) {
    return `z.intersection(${schema.allOf.map((s, i) => toZodSchema(`${name}_allof_${i}`, s, schemas)).join(", ")})`;
  }

  if (schema.enum) {
    const allStrings = schema.enum.every(v => typeof v === "string");
    if (allStrings) {
      const values = schema.enum.map(v => JSON.stringify(v)).join(", ");
      return `z.enum([${values}])`;
    }
    const literals = schema.enum.map(v => {
      if (typeof v === "string") return `z.literal(${JSON.stringify(v)})`;
      if (typeof v === "boolean") return `z.literal(${v})`;
      if (typeof v === "number") return `z.literal(${v})`;
      return `z.literal(${JSON.stringify(v)})`;
    });
    if (literals.length === 1) return literals[0];
    return `z.union([${literals.join(", ")}])`;
  }

  if (schema.type === "object" && schema.properties) {
    const props: string[] = [];
    const requiredSet = new Set(schema.required ?? []);
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const propZod = toZodSchema(`${name}_${key}`, propSchema, schemas);
      if (!requiredSet.has(key)) {
        props.push(`  ${JSON.stringify(key)}: ${propZod}.optional()`);
      } else {
        props.push(`  ${JSON.stringify(key)}: ${propZod}`);
      }
    }
    return `z.object({\n${props.join(",\n")}\n})`;
  }

  if (schema.type === "array" && schema.items) {
    const itemsZod = toZodSchema(`${name}_items`, schema.items, schemas);
    return `z.array(${itemsZod})`;
  }

  if (schema.type === "string") {
    let zod = "z.string()";
    if (schema.format === "date-time" || schema.format === "date") zod += ".datetime()";
    if (schema.minLength) zod += `.min(${schema.minLength})`;
    if (schema.maxLength) zod += `.max(${schema.maxLength})`;
    if (schema.pattern) zod += `.regex(/${schema.pattern}/)`;
    return zod;
  }

  if (schema.type === "number" || schema.type === "integer") {
    let zod = schema.type === "integer" ? "z.number().int()" : "z.number()";
    if (schema.minimum !== undefined) zod += `.min(${schema.minimum})`;
    if (schema.maximum !== undefined) zod += `.max(${schema.maximum})`;
    return zod;
  }

  if (schema.type === "boolean") {
    return "z.boolean()";
  }

  return "z.any()";
}

function sanitizeName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function main(): void {
  if (!existsSync(GATEWAY_SPEC_PATH)) {
    console.error(`[generate-zod-schemas] ERROR: OpenAPI spec not found at ${GATEWAY_SPEC_PATH}`);
    process.exitCode = 1;
    return;
  }

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const spec = JSON.parse(readFileSync(GATEWAY_SPEC_PATH, "utf-8")) as {
    components?: OpenAPIComponents;
  };

  const schemas = spec.components?.schemas ?? {};
  const schemaNames = Object.keys(schemas);

  if (schemaNames.length === 0) {
    console.warn("[generate-zod-schemas] ⚠️ No schemas found in OpenAPI spec");
    writeFileSync(OUTPUT_PATH, `// No schemas found in OpenAPI spec\n`, "utf-8");
    return;
  }

  const imports = [`import { z } from "zod";`, ``];

  const exports: string[] = [];

  for (const name of schemaNames) {
    const safeName = sanitizeName(name);
    const schema = schemas[name];
    const zodCode = toZodSchema(name, schema, schemas);
    exports.push(`export const ${safeName}Schema = ${zodCode};`);
  }

  const content = [
    ...imports,
    `// Auto-generated by generate-zod-schemas.ts`,
    `// Schema count: ${schemaNames.length}`,
    ``,
    ...exports,
    ``,
  ].join("\n");

  writeFileSync(OUTPUT_PATH, content, "utf-8");
  console.log(`[generate-zod-schemas] ✅ Generated ${schemaNames.length} Zod schemas at ${OUTPUT_PATH}`);
}

main();
