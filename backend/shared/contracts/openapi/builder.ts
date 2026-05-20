import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";

import type {
  OpenAPIMethod,
  AddEndpointConfig,
  OpenAPIPartial,
  OpenAPIObject,
} from "./types.js";

export class OpenAPIBuilder {
  private readonly title: string;
  private readonly version: string;
  private readonly serverUrl: string;
  private readonly basePath: string;
  private readonly paths: Record<string, Record<string, unknown>> = {};
  private readonly schemas: Record<string, unknown> = {};
  private readonly tagsList: { name: string; description?: string }[] = [];

  constructor(config: {
    title: string;
    version: string;
    serverUrl: string;
    basePath?: string;
  }) {
    this.title = config.title;
    this.version = config.version;
    this.serverUrl = config.serverUrl;
    this.basePath = config.basePath ?? "";
  }

  addTag(name: string, description?: string): this {
    this.tagsList.push({ name, description });
    return this;
  }

  addEndpoint(
    path: string,
    method: OpenAPIMethod,
    config: AddEndpointConfig,
  ): this {
    const fullPath = `${this.basePath}${path}`;
    const openApiPath = fullPath.replace(/:([^/]+)/g, "{$1}");

    const operation: Record<string, unknown> = {};

    if (config.summary) operation.summary = config.summary;
    if (config.description) operation.description = config.description;
    if (config.tags && config.tags.length > 0) operation.tags = config.tags;

    const parameters: Record<string, unknown>[] = [];

    const pathParamNames = [
      ...path.matchAll(/:([^/]+)/g),
    ].map((m) => m[1]);

    for (const paramName of pathParamNames) {
      let paramSchema: Record<string, unknown> = { type: "string" };
      if (config.paramsSchema instanceof z.ZodObject) {
        const shape = (config.paramsSchema as z.ZodObject<any>)._def.shape();
        if (shape[paramName]) {
          paramSchema = this.zodTypeToJsonSchema(
            shape[paramName] as z.ZodTypeAny,
          );
        }
      }
      parameters.push({
        name: paramName,
        in: "path",
        required: true,
        schema: paramSchema,
      });
    }

    if (config.querySchema instanceof z.ZodObject) {
      const shape = (config.querySchema as z.ZodObject<any>)._def.shape();
      for (const [key, zodType] of Object.entries(shape)) {
        const isOptional =
          zodType instanceof z.ZodOptional ||
          zodType instanceof z.ZodDefault ||
          zodType instanceof z.ZodNullable;
        parameters.push({
          name: key,
          in: "query",
          required: !isOptional,
          schema: this.zodTypeToJsonSchema(zodType as z.ZodTypeAny),
        });
      }
    }

    if (parameters.length > 0) {
      operation.parameters = parameters;
    }

    if (config.bodySchema) {
      const ref = this.addZodSchema(
        `${this.schemaPrefix(method, path)}_RequestBody`,
        config.bodySchema,
      );
      operation.requestBody = {
        required: true,
        content: {
          "application/json": { schema: { $ref: ref } },
        },
      };
    }

    const responses: Record<string, unknown> = {};
    for (const [statusCode, respConfig] of Object.entries(config.responses)) {
      const entry: Record<string, unknown> = {
        description: respConfig.description,
      };
      if (respConfig.schema) {
        const ref = this.addZodSchema(
          `${this.schemaPrefix(method, path)}_${statusCode}Response`,
          respConfig.schema,
        );
        entry.content = {
          "application/json": { schema: { $ref: ref } },
        };
      }
      responses[statusCode] = entry;
    }
    operation.responses = responses;

    if (!this.paths[openApiPath]) {
      this.paths[openApiPath] = {};
    }
    this.paths[openApiPath][method] = operation;

    return this;
  }

  addZodSchema<T extends z.ZodTypeAny>(name: string, schema: T): string {
    const jsonSchema = zodToJsonSchema(schema, {
      target: "openApi3",
      $refStrategy: "none",
    });

    const clean = { ...(jsonSchema as Record<string, unknown>) };
    delete clean.$schema;

    this.schemas[name] = clean;
    return `#/components/schemas/${name}`;
  }

  toJSON(): OpenAPIPartial {
    return {
      title: this.title,
      version: this.version,
      serverUrl: this.serverUrl,
      basePath: this.basePath,
      paths: this.paths,
      components: { schemas: this.schemas },
      tags: this.tagsList.length > 0 ? this.tagsList : undefined,
    };
  }

  toFile(filePath: string): void {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(filePath, JSON.stringify(this.toJSON(), null, 2), "utf-8");
    console.log(
      `[OpenAPIBuilder] ✅ OpenAPI partial written to ${filePath}`,
    );
  }

  static merge(partials: OpenAPIPartial[]): OpenAPIObject {
    const merged: OpenAPIObject = {
      openapi: "3.1.0",
      info: { title: "UniConnect API", version: "0.0.0" },
      servers: [],
      paths: {},
      components: { schemas: {} },
      tags: [],
    };

    const seenServers = new Set<string>();
    const seenTags = new Set<string>();

    for (const partial of partials) {
      for (const [p, methods] of Object.entries(partial.paths)) {
        if (!merged.paths[p]) {
          merged.paths[p] = {};
        }
        Object.assign(merged.paths[p], methods);
      }

      if (partial.components?.schemas) {
        for (const [name, schema] of Object.entries(
          partial.components.schemas,
        )) {
          if (merged.components.schemas[name]) {
            console.warn(
              `[OpenAPIBuilder] ⚠️ Schema conflict: "${name}" already exists — skipping duplicate`,
            );
            continue;
          }
          merged.components.schemas[name] = schema;
        }
      }

      if (partial.serverUrl && !seenServers.has(partial.serverUrl)) {
        merged.servers.push({
          url: partial.serverUrl,
          description: partial.title,
        });
        seenServers.add(partial.serverUrl);
      }

      if (partial.tags) {
        for (const tag of partial.tags) {
          if (!seenTags.has(tag.name)) {
            merged.tags.push(tag);
            seenTags.add(tag.name);
          }
        }
      }
    }

    return merged;
  }

  private schemaPrefix(method: string, path: string): string {
    const clean = path
      .replace(/[{}]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
    const cap = method.charAt(0).toUpperCase() + method.slice(1);
    return `${cap}_${clean}`;
  }

  private zodTypeToJsonSchema(
    zodType: z.ZodTypeAny,
  ): Record<string, unknown> {
    const result = zodToJsonSchema(zodType, {
      target: "openApi3",
      $refStrategy: "none",
    });
    const clean = { ...(result as Record<string, unknown>) };
    delete clean.$schema;
    return clean;
  }
}
