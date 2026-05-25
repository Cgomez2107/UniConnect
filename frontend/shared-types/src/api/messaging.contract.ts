import { z } from "zod";
import { ConversationSchema } from "../schemas/messaging.schema.js";
import type { ApiContract } from "./_base.contract.js";

export const CreateConversationRequestSchema = z.object({
  body: z.object({
    type: z.enum(["direct", "group"]),
    name: z.string().max(200).optional(),
    participantIds: z.array(z.string().uuid()).min(2).max(50),
  }),
});

export const CreateConversationResponseSchema = z.object({
  conversation: ConversationSchema,
});

export const SendMessageRequestSchema = z.object({
  body: z.object({
    conversationId: z.string().uuid(),
    content: z.string().min(1).max(5000),
    type: z.enum(["text", "file", "mention", "reaction"]).default("text"),
  }),
});

export const SendMessageResponseSchema = z.object({
  message: z.object({
    id: z.string().uuid(),
    conversationId: z.string().uuid(),
    senderId: z.string().uuid(),
    content: z.string(),
    type: z.enum(["text", "file", "mention", "reaction"]),
    createdAt: z.string().datetime(),
  }),
});

export const CreateConversationContract: ApiContract<typeof CreateConversationRequestSchema, typeof CreateConversationResponseSchema> = {
  method: "POST",
  path: "/api/v1/conversations",
  request: CreateConversationRequestSchema,
  response: CreateConversationResponseSchema,
};

export type CreateConversationRequest = z.infer<typeof CreateConversationRequestSchema>;
export type CreateConversationResponse = z.infer<typeof CreateConversationResponseSchema>;
export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;
export type SendMessageResponse = z.infer<typeof SendMessageResponseSchema>;
