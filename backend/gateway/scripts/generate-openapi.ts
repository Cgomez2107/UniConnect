import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  LoginContract,
  RegisterContract,
  RefreshTokenContract,
  CreateGroupContract,
  CreateResourceContract,
  CreateConversationContract,
  CreateEventContract,
  CreateQuestionContract,
  ListQuestionsContract,
  GetQuestionDetailContract,
  CreateAnswerContract,
  CastVoteContract,
  MarkSolutionContract,
  ListAnswersContract,
} from "@uniconnect/shared-types";
import type { ZodTypeAny } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type Contract = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  request: ZodTypeAny;
  response: ZodTypeAny;
};

const contracts: Contract[] = [
  LoginContract,
  RegisterContract,
  RefreshTokenContract,
  CreateGroupContract,
  CreateResourceContract,
  CreateConversationContract,
  CreateEventContract,
  CreateQuestionContract,
  ListQuestionsContract,
  GetQuestionDetailContract,
  CreateAnswerContract,
  CastVoteContract,
  MarkSolutionContract,
  ListAnswersContract,
];

function convertPathParams(path: string): string {
  return path.replaceAll(/:(\w+)/g, "{$1}");
}

function getStatusCode(method: string): number {
  if (method === "POST") return 201;
  if (method === "DELETE") return 204;
  return 200;
}

function getStatusDescription(code: number): string {
  if (code === 201) return "Created";
  if (code === 204) return "No Content";
  if (code === 200) return "OK";
  return "Success";
}

function inferTag(path: string): string {
  const segments = path.split("/").filter(Boolean);
  for (const seg of segments) {
    if (seg === "api" || seg === "v1") continue;
    if (seg === "study-groups") return "Study Groups";
    if (seg === "resources") return "Resources";
    if (seg === "conversations" || seg === "messages") return "Messaging";
    if (seg === "events") return "Events";
    if (seg === "forum") return "Forum";
    if (seg === "auth") return "Authentication";
    return seg.charAt(0).toUpperCase() + seg.slice(1);
  }
  return "Default";
}

function buildOpenApi(specs: Contract[]) {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const spec of specs) {
    const openApiPath = convertPathParams(spec.path);
    const method = spec.method.toLowerCase() as "get" | "post" | "put" | "patch" | "delete";
    const tag = inferTag(spec.path);
    const statusCode = getStatusCode(spec.method);
    const operationId = `${spec.method}${spec.path.replace(/[\/:{}]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "")}`;

    const shape = "shape" in spec.request ? (spec.request as { shape: Record<string, ZodTypeAny> }).shape : {};

    const parameters: Record<string, unknown>[] = [];

    const pathParamNames: string[] = [];
    for (const match of spec.path.matchAll(/:(\w+)/g)) {
      pathParamNames.push(match[1]);
    }
    if (pathParamNames.length > 0) {
      const pathShape = shape.params ? (shape.params as { shape: Record<string, ZodTypeAny> }).shape : {};
      for (const name of pathParamNames) {
        const fieldSchema = pathShape[name];
        if (fieldSchema) {
          const jsonSchema = zodToJsonSchema(fieldSchema, { target: "openApi3" }) as Record<string, unknown>;
          parameters.push({
            name,
            in: "path",
            required: true,
            schema: jsonSchema,
          });
        } else {
          parameters.push({
            name,
            in: "path",
            required: true,
            schema: { type: "string" },
          });
        }
      }
    }

    if (shape.query) {
      const queryShape = (shape.query as { shape: Record<string, ZodTypeAny> }).shape;
      for (const [key, fieldSchema] of Object.entries(queryShape)) {
        const jsonSchema = zodToJsonSchema(fieldSchema, { target: "openApi3" }) as Record<string, unknown>;
        const isOptional =
          String(fieldSchema.constructor).includes("ZodOptional") ||
          String(fieldSchema.constructor).includes("ZodDefault");
        parameters.push({
          name: key,
          in: "query",
          required: !isOptional,
          schema: jsonSchema,
        });
      }
    }

    const pathItem: Record<string, unknown> = {
      tags: [tag],
      summary: `${spec.method} ${spec.path}`,
      operationId,
    };

    if (parameters.length > 0) {
      pathItem.parameters = parameters;
    }

    if (["post", "put", "patch"].includes(method) && shape.body) {
      const bodySchema = zodToJsonSchema(shape.body, { target: "openApi3" });
      pathItem.requestBody = {
        required: true,
        content: {
          "application/json": { schema: bodySchema },
        },
      };
    }

    const responseSchema = zodToJsonSchema(spec.response, { target: "openApi3" });

    const responses: Record<string, unknown> = {
      [statusCode]: {
        description: getStatusDescription(statusCode),
      },
    };

    if (statusCode !== 204) {
      (responses[statusCode] as Record<string, unknown>).content = {
        "application/json": { schema: responseSchema },
      };
    }

    responses["400"] = { $ref: "#/components/responses/BadRequest" };
    responses["401"] = { $ref: "#/components/responses/Unauthorized" };
    responses["403"] = { $ref: "#/components/responses/Forbidden" };
    responses["404"] = { $ref: "#/components/responses/NotFound" };
    responses["500"] = { $ref: "#/components/responses/InternalServerError" };

    pathItem.responses = responses;

    if (!paths[openApiPath]) {
      paths[openApiPath] = {};
    }
    paths[openApiPath][method] = pathItem;
  }

  const errorSchema = {
    type: "object",
    properties: {
      error: { type: "string" },
      message: { type: "string" },
      request_id: { type: "string" },
    },
    required: ["error", "message"],
  };

  const doc = {
    openapi: "3.1.0",
    info: {
      title: "UniConnect Backend API",
      version: "1.0.0",
      description:
        "API de UniConnect — Red académica para la Universidad de Caldas. Documentación autogenerada desde contratos Zod.",
    },
    servers: [
      { url: "http://localhost:3000", description: "Local development" },
    ],
    paths,
    components: {
      schemas: {
        ErrorResponse: errorSchema,
      },
      responses: {
        BadRequest: {
          description: "Bad Request — Error de validación",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
        Unauthorized: {
          description: "Unauthorized — Token inválido o ausente",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
        Forbidden: {
          description: "Forbidden — Sin permisos suficientes",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
        NotFound: {
          description: "Not Found — Recurso no encontrado",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
        InternalServerError: {
          description: "Internal Server Error",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
        },
      },
    },
  };

  return doc;
}

const doc = buildOpenApi(contracts);
const outputPath = resolve(__dirname, "..", "openapi.json");
writeFileSync(outputPath, JSON.stringify(doc, null, 2), "utf-8");
console.log(`[generate-openapi] OpenAPI spec generated: ${outputPath}`);
