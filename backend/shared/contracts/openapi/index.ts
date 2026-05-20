export { OpenAPIBuilder } from "./builder.js";
export type { AddEndpointConfig, OpenAPIMethod, OpenAPIPartial, OpenAPIObject } from "./types.js";

import { z } from "zod";

/**
 * Wraps a schema in the standard { data: T } response envelope.
 * Use for single-resource responses (GET/:id, POST, PUT, PATCH).
 */
export function dataResponse<T extends z.ZodTypeAny>(schema: T): z.ZodObject<{ data: T }> {
  return z.object({ data: schema });
}

/**
 * Wraps a schema in the standard { data: T[], meta: { total } } response envelope.
 * Use for paginated list responses (GET /resource).
 */
export function dataListResponse<T extends z.ZodTypeAny>(schema: T) {
  return z.object({
    data: z.array(schema),
    meta: z.object({ total: z.number().int().nonnegative() }),
  });
}

/**
 * Standard message-only response { data: { message: string } }.
 * Use for action endpoints (leave, cancel, delete, transfer, etc.).
 */
export function messageResponse(): z.ZodObject<{ data: z.ZodObject<{ message: z.ZodString }> }> {
  return z.object({
    data: z.object({ message: z.string() }),
  });
}

/**
 * Standard status response { data: { success: boolean, message: string } }.
 * Use for subscription endpoints and similar status-returning actions.
 */
export function statusResponse(): z.ZodObject<{ data: z.ZodObject<{ success: z.ZodBoolean; message: z.ZodString }> }> {
  return z.object({
    data: z.object({ success: z.boolean(), message: z.string() }),
  });
}
