import { z } from "zod";
import { StudyResourceSchema } from "../schemas/resource.schema.js";
import type { ApiContract } from "./_base.contract.js";

export const CreateResourceRequestSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    url: z.string().url(),
    subjectId: z.string().uuid(),
    tags: z.array(z.string().max(50)).optional(),
    isPublic: z.boolean().default(true),
    ogTitle: z.string().nullable().optional(),
    ogDescription: z.string().nullable().optional(),
    ogImage: z.string().nullable().optional(),
  }),
});

export const CreateResourceResponseSchema = z.object({
  resource: StudyResourceSchema,
});

export const CreateResourceContract: ApiContract<typeof CreateResourceRequestSchema, typeof CreateResourceResponseSchema> = {
  method: "POST",
  path: "/api/v1/resources",
  request: CreateResourceRequestSchema,
  response: CreateResourceResponseSchema,
};

export type CreateResourceRequest = z.infer<typeof CreateResourceRequestSchema>;
export type CreateResourceResponse = z.infer<typeof CreateResourceResponseSchema>;

// ── Open Graph parse contract ─────────────────────────────────────────────

export const ParseUrlRequestSchema = z.object({
  body: z.object({
    url: z.string().url(),
  }),
});

export const ParseUrlResponseSchema = z.object({
  ogTitle: z.string().nullable(),
  ogDescription: z.string().nullable(),
  ogImage: z.string().nullable(),
});

export const ParseUrlContract: ApiContract<typeof ParseUrlRequestSchema, typeof ParseUrlResponseSchema> = {
  method: "POST",
  path: "/api/v1/resources/parse-url",
  request: ParseUrlRequestSchema,
  response: ParseUrlResponseSchema,
};

export type ParseUrlRequest = z.infer<typeof ParseUrlRequestSchema>;
export type ParseUrlResponse = z.infer<typeof ParseUrlResponseSchema>;
