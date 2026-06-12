import { z } from "zod";
import { ChatbotMessageRequestSchema, ChatbotMessageResponseSchema } from "../schemas/chatbot.schema";
import type { ApiContract } from "./_base.contract";

export const SendChatbotMessageRequestSchema = z.object({
  body: ChatbotMessageRequestSchema,
});

export const SendChatbotMessageResponseSchema = ChatbotMessageResponseSchema;

export const SendChatbotMessageContract: ApiContract<
  typeof SendChatbotMessageRequestSchema,
  typeof SendChatbotMessageResponseSchema
> = {
  method: "POST",
  path: "/api/v1/chatbot/message",
  request: SendChatbotMessageRequestSchema,
  response: SendChatbotMessageResponseSchema,
};

export type SendChatbotMessageRequest = z.infer<typeof SendChatbotMessageRequestSchema>;
export type SendChatbotMessageResponse = z.infer<typeof SendChatbotMessageResponseSchema>;
