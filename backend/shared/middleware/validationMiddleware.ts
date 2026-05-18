import type { ServerResponse } from "node:http";
import type { ZodTypeAny } from "zod";
import { sendJson } from "../http/sendJson.js";
import { zodErrorToApiError } from "@uniconnect/shared-types";

export type ValidationSource = "body" | "query" | "params";

export type ValidationTarget = {
  body?: unknown;
  query?: unknown;
  params?: unknown;
};

export type ValidationResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
};

function normalizeInput(input: unknown): unknown {
  if (typeof input !== "string") {
    return input;
  }

  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
}

function sendValidationError(res: ServerResponse, source: ValidationSource, details?: Record<string, unknown>): void {
  sendJson(res, 400, {
    error: "VALIDATION_ERROR",
    message: "El cuerpo de la solicitud no cumple el contrato",
    details: {
      source,
      ...details,
    },
  });
}

function validateSource<T>(
  schema: ZodTypeAny,
  input: unknown,
  res: ServerResponse,
  source: ValidationSource,
): ValidationResult<T> {
  const normalized = normalizeInput(input);

  if (source === "body" && typeof input === "string" && normalized === input) {
    sendValidationError(res, source, {
      formErrors: ["Invalid JSON body"],
      fieldErrors: { body: ["Invalid JSON body"] },
    });
    return { success: false };
  }

  const result = schema.safeParse(normalized);

  if (!result.success) {
    const apiError = zodErrorToApiError(result.error);
    sendJson(res, 400, {
      ...apiError,
      details: {
        ...apiError.details,
        source,
      },
    });
    return { success: false };
  }

  return { success: true, data: result.data as T };
}

export function validateBody<T>(schema: ZodTypeAny, body: unknown, res: ServerResponse): T | null {
  const result = validateSource<T>(schema, body, res, "body");
  return result.success ? result.data : null;
}

export function validateQuery<T>(schema: ZodTypeAny, query: unknown, res: ServerResponse): T | null {
  const result = validateSource<T>(schema, query, res, "query");
  return result.success ? result.data : null;
}

export function validateParams<T>(schema: ZodTypeAny, params: unknown, res: ServerResponse): T | null {
  const result = validateSource<T>(schema, params, res, "params");
  return result.success ? result.data : null;
}
