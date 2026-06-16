import { z } from "zod";
import { ChatbotMessageRequestSchema, ChatbotMessageResponseSchema } from "../schemas/chatbot.schema.js";
export const SendChatbotMessageRequestSchema = z.object({
    body: ChatbotMessageRequestSchema,
});
export const SendChatbotMessageResponseSchema = ChatbotMessageResponseSchema;
export const SendChatbotMessageContract = {
    method: "POST",
    path: "/api/v1/chatbot/message",
    request: SendChatbotMessageRequestSchema,
    response: SendChatbotMessageResponseSchema,
};
//# sourceMappingURL=chatbot.contract.js.map