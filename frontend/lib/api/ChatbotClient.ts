import { fetchApi } from "./httpClient";
import type { SendChatbotMessageRequest, SendChatbotMessageResponse } from "@uniconnect/shared-types";

export interface ChatbotClientOptions {
  signal?: AbortSignal;
}

export class ChatbotClient {
  async sendMessage(
    request: SendChatbotMessageRequest,
    options?: ChatbotClientOptions
  ): Promise<SendChatbotMessageResponse> {
    return fetchApi<SendChatbotMessageResponse>("/chatbot/message", {
      method: "POST",
      body: JSON.stringify(request.body),
      signal: options?.signal,
    });
  }
}
