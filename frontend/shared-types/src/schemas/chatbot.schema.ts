import { z } from "zod";

export const ChatbotMessageRequestSchema = z.object({
  message: z.string().min(1),
  history: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ).optional(),
});

export const ChatbotMessageResponseSchema = z.object({
  reply: z.string(),
  referencias: z.array(
    z.object({
      id: z.string().optional(),
      source: z.string().optional(),
      similarity: z.number().nullable().optional(),
    })
  ).optional(),
});
