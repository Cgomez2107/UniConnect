import type { z } from "zod";

export type OpenAPIMethod = "get" | "post" | "put" | "patch" | "delete";

export interface AddEndpointConfig {
  summary?: string;
  description?: string;
  tags?: string[];
  bodySchema?: z.ZodTypeAny;
  querySchema?: z.ZodTypeAny;
  paramsSchema?: z.ZodTypeAny;
  responses: Record<string, {
    description: string;
    schema?: z.ZodTypeAny;
  }>;
}

export interface OpenAPIPartial {
  title: string;
  version: string;
  serverUrl: string;
  basePath?: string;
  paths: Record<string, Record<string, unknown>>;
  components: { schemas: Record<string, unknown> };
  tags?: { name: string; description?: string }[];
}

export interface OpenAPIObject {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers: {
    url: string;
    description?: string;
  }[];
  paths: Record<string, Record<string, unknown>>;
  components: {
    schemas: Record<string, unknown>;
  };
  tags: {
    name: string;
    description?: string;
  }[];
}
