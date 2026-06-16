import type { ITransport } from "../transport/index.js";
import type { SendChatbotMessageRequest, SendChatbotMessageResponse } from "@uniconnect/shared-types";

export interface ChatbotClientOptions {
  signal?: AbortSignal;
}

export class ChatbotClient {
  constructor(private transport: ITransport) {}

  async sendMessage(
    request: SendChatbotMessageRequest,
    options?: ChatbotClientOptions
  ): Promise<SendChatbotMessageResponse> {
    const response = await this.transport.request<SendChatbotMessageResponse>({
      method: "POST",
      url: "/chatbot/message",
      body: request.body,
      signal: options?.signal,
    });

    return response.data;
  }
}
