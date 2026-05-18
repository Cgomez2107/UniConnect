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
