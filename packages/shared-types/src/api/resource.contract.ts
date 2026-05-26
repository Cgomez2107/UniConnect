import { z } from "zod";
import { StudyResourceSchema } from "../schemas/resource.schema.js";
import type { ApiContract } from "./_base.contract.js";

export const CreateResourceRequestSchema = z.object({
  body: z.object({
    programId: z.string(),
    subjectId: z.string(),
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    fileUrl: z.string(),
    fileName: z.string(),
    fileType: z.string().optional(),
    fileSizeKb: z.number().positive().optional(),
    resourceType: z.string().optional(),
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
